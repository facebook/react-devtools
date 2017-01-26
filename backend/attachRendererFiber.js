/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

import type {Hook, ReactRenderer, Helpers} from './types';
var getDataFiber = require('./getDataFiber');

function attachRendererFiber(hook: Hook, rid: string, renderer: ReactRenderer): Helpers {
  // The naming is confusing.
  // They deal with opaque nodes (fibers), not elements.
  function getNativeFromReactElement(fiber) {
    try {
      return renderer.findHostInstanceByFiber(fiber);
    } catch (err) {
      // The fiber might have unmounted by now.
      return null;
    }
  }
  function getReactElementFromNative(node) {
    const fiber = renderer.findFiberByHostInstance(node);
    return fiber;
  }

  // This is a slightly annoying indirection.
  // It is currently necessary because DevTools wants
  // to use unique objects as keys for instances.
  // However fibers have two versions.
  // We use this set to remember first encountered fiber for
  // each conceptual instance.
  const opaqueNodes = new Set();
  function getOpaqueNode(fiber) {
    if (opaqueNodes.has(fiber)) {
      return fiber;
    }
    const {alternate} = fiber;
    if (alternate != null && opaqueNodes.has(alternate)) {
      return alternate;
    }
    opaqueNodes.add(fiber);
    return fiber;
  }

  function haveChildrenChanged(prevChildren, nextChildren) {
    if (!Array.isArray(prevChildren) || !Array.isArray(nextChildren)) {
      return prevChildren !== nextChildren;
    }
    if (prevChildren.length !== nextChildren.length) {
      return true;
    }
    for (let i = 0; i < prevChildren.length; i++) {
      if (prevChildren[i] !== nextChildren[i]) {
        return true;
      }
    }
    return false;
  }

  function hasDataChanged(prevData, nextData) {
    return (
      prevData.ref !== nextData.ref ||
      prevData.source !== nextData.source ||
      prevData.props !== nextData.props ||
      prevData.state !== nextData.state ||
      prevData.context !== nextData.context ||
      prevData.text !== nextData.text ||
      haveChildrenChanged(prevData.children, nextData.children)
    );
  }

  let pendingEvents = [];

  function flushPendingEvents() {
    const events = pendingEvents;
    pendingEvents = [];
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      hook.emit(event._event, event);
    }
  }

  function enqueueMount(fiber) {
    pendingEvents.push({
      // TODO: the naming is confusing. `element` is *not* a React element. It is an opaque ID.
      element: getOpaqueNode(fiber),
      data: getDataFiber(fiber, getOpaqueNode),
      renderer: rid,
      _event: 'mount',
    });

    const isRoot = fiber.tag === 3;
    if (isRoot) {
      pendingEvents.push({
        element: getOpaqueNode(fiber),
        renderer: rid,
        _event: 'root',
      });
    }
  }

  function enqueueUpdateIfNecessary(fiber) {
    const nextData = getDataFiber(fiber, getOpaqueNode);
    const prevData = getDataFiber(fiber.alternate, getOpaqueNode);
    // Avoid unnecessary updates since they are common
    // when something changes deep in the tree due to setState.
    if (!hasDataChanged(prevData, nextData)) {
      return;
    }
    pendingEvents.push({
      element: getOpaqueNode(fiber),
      data: nextData,
      renderer: rid,
      _event: 'update',
    });
  }

  function enqueueUnmount(fiber) {
    const isRoot = fiber.tag === 3;
    const event = {
      element: getOpaqueNode(fiber),
      renderer: rid,
      _event: 'unmount',
    };
    if (isRoot) {
      pendingEvents.push(event);
    } else {
      // Non-root fibers are deleted during the commit phase.
      // They are deleted in the child-first order. However
      // DevTools currently expects deletions to be parent-first.
      // This is why we unshift deletions rather than push them.
      pendingEvents.unshift(event);
    }
    opaqueNodes.delete(fiber);
    if (fiber.alternate != null) {
      opaqueNodes.delete(fiber.alternate);
    }
  }

  function mountFiber(fiber) {
    // Depth-first.
    // Logs mounting of children first, parents later.
    let node = fiber;
    outer: while (true) {
      if (node.child) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      enqueueMount(node);
      if (node == fiber) {
        return;
      }
      if (node.sibling) {
        node.sibling.return = node.return;
        node = node.sibling;
        continue;
      }
      while (node.return) {
        node = node.return;
        enqueueMount(node);
        if (node == fiber) {
          return;
        }
        if (node.sibling) {
          node.sibling.return = node.return;
          node = node.sibling;
          continue outer;
        }
      }
      return;
    }
  }

  function updateFiber(nextFiber, prevFiber) {
    if (nextFiber.child !== prevFiber.child) {
      // If the first child is not equal, all children are not equal.
      let nextChild = nextFiber.child;
      while (nextChild) {
        if (nextChild.alternate) {
          updateFiber(nextChild, nextChild.alternate);
        } else {
          mountFiber(nextChild);
        }
        nextChild = nextChild.sibling;
      }
    }
    enqueueUpdateIfNecessary(nextFiber);
  }

  function walkTree() {
    hook.getFiberRoots(rid).forEach(root => {
      // Hydrate all the roots for the first time.
      mountFiber(root.current);
    });
    flushPendingEvents();
  }

  function cleanup() {
    // We don't patch any methods so there is no cleanup.
  }

  function handleCommitFiberUnmount(fiber) {
    // This is not recursive.
    // We can't traverse fibers after unmounting so instead
    // we rely on React telling us about each unmount.
    // It will be flushed after the root is committed.
    enqueueUnmount(fiber);
  }

  function handleCommitFiberRoot(root) {
    const current = root.current;
    const alternate = current.alternate;
    if (alternate) {
      // TODO: relying on this seems a bit fishy.
      const wasMounted = alternate.memoizedState != null && alternate.memoizedState.element != null;
      const isMounted = current.memoizedState != null && current.memoizedState.element != null;
      if (!wasMounted && isMounted) {
        // Mount a new root.
        mountFiber(current);
      } else if (wasMounted && isMounted) {
        // Update an existing root.
        updateFiber(current, alternate);
      } else if (wasMounted && !isMounted) {
        // Unmount an existing root.
        enqueueUnmount(current);
      }
    } else {
      // Mount a new root.
      mountFiber(current);
    }
    // We're done here.
    flushPendingEvents();
  }

  return {
    getNativeFromReactElement,
    getReactElementFromNative,
    handleCommitFiberRoot,
    handleCommitFiberUnmount,
    cleanup,
    walkTree,
  };
}

module.exports = attachRendererFiber;
