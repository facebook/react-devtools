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
  function getNativeFromReactElement() {
    // TODO
    // This will likely require using Fibers
    // as "opaque" IDs instead of debugIDs,
    // and exposing the host component tree again.
    return null;
  }

  function getReactElementFromNative() {
    // TODO
    // This will likely require using Fibers
    // as "opaque" IDs instead of debugIDs,
    // and exposing the host component tree again.
    return null;
  }

  function walkTree() {
    // TODO
    // So far we didn't need this in Fiber
    // since we always walk the tree anyway.
  }

  function enqueueMount(fiber, events) {
    events.push({
      // TODO: we might need to pass Fiber instead to implement getNativeFromReactElement().
      // TODO: the naming is confusing. `element` is *not* a React element. It is an opaque ID.
      element: fiber._debugID,
      data: getDataFiber(fiber),
      renderer: rid,
      _event: 'mount',
    });
    const isRoot = fiber.tag === 3;
    if (isRoot) {
      events.push({
        element: fiber._debugID,
        renderer: rid,
        _event: 'root',
      });
    }
  }

  function enqueueUpdate(fiber, events) {
    events.push({
      element: fiber._debugID,
      data: getDataFiber(fiber),
      renderer: rid,
      _event: 'update',
    });
  }

  function enqueueUnmount(fiber, events) {
    events.push({
      element: fiber._debugID,
      renderer: rid,
      _event: 'unmount',
    });
  }

  function mapChildren(parent, allKeys) {
    const children = new Map();
    let node = parent.child;
    while (node) {
      const key = node.key || node.index;
      allKeys.add(key);
      children.set(key, node);
      node = node.sibling;
    }
    return children;
  }

  function unmountFiber(fiber, events) {
    // Depth-first.
    // Logs unmounting of children first, parents later.
    let node = fiber;
    outer: while (true) {
      if (node.child) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      enqueueUnmount(node, events);
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
        enqueueUnmount(node, events);
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

  function mountFiber(fiber, events) {
    // Depth-first.
    // Logs mounting of children first, parents later.
    let node = fiber;
    outer: while (true) {
      if (node.child) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      enqueueMount(node, events);
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
        enqueueMount(node, events);
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

  function updateFiber(nextFiber, prevFiber, events) {
    // TODO: optimize for the common case of children with implcit keys.
    // Just like we do in the Fiber child reconciler.
    // We shouldn't be allocating Maps all the time.
    const allKeys = new Set();
    const prevChildren = mapChildren(prevFiber, allKeys);
    const nextChildren = mapChildren(nextFiber, allKeys);
    allKeys.forEach(key => {
      const prevChild = prevChildren.get(key);
      const nextChild = nextChildren.get(key);
      if (prevChild != null && nextChild != null) {
        // TODO: are there more cases when we can bail out?
        if (prevChild !== nextChild) {
          if (prevChild.type === nextChild.type) {
            // We already know their keys match.
            updateFiber(nextChild, prevChild, events);
          } else {
            // These are different fibers.
            unmountFiber(prevChild, events);
            mountFiber(nextChild, events);
          }
        }
      } else if (nextChild != null) {
        mountFiber(nextChild, events);
      } else if (prevChild != null) {
        unmountFiber(prevChild, events);
      }
    });
    enqueueUpdate(nextFiber, events);
  }

  let subscription = null;

  function cleanup() {
    if (subscription) {
      const {unsubscribe} = subscription;
      subscription = null;
      unsubscribe();
    }
  }

  function emitEvents(events) {
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      hook.emit(event._event, event);
    }
  }

  function handleFiberCommit(root) {
    const current = root.current;
    const alternate = current.alternate;
    const events = [];
    if (alternate && subscription != null) {
      // TODO: relying on this seems a bit fishy.
      const wasMounted = alternate.memoizedState != null && alternate.memoizedState.element != null;
      const isMounted = current.memoizedState != null && current.memoizedState.element != null;
      if (!wasMounted && isMounted) {
        // Mount a new root.
        mountFiber(current, events);
      } else if (wasMounted && isMounted) {
        // Update an existing root.
        updateFiber(current, alternate, events);
      } else if (wasMounted && !isMounted) {
        // Unmount an existing root.
        unmountFiber(current, events);
      }
    } else {
      // Hydrate an existing root or mount a new one.
      mountFiber(current, events);
    }
    try {
      emitEvents(events);
    } catch (err) {
      console.error(err);
    }
  }

  subscription = renderer.subscribeToFiberCommits(handleFiberCommit);

  return {
    getNativeFromReactElement,
    getReactElementFromNative,
    cleanup,
    walkTree,
  };
}

module.exports = attachRendererFiber;
