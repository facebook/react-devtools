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

import type {Hook, ReactRenderer, DataType, Helpers} from './types';

var semver = require('semver');

var copyWithSet = require('./copyWithSet');
var getDisplayName = require('./getDisplayName');

// Taken from ReactElement.
function resolveDefaultProps(Component: any, baseProps: Object): Object {
  if (Component && Component.defaultProps) {
    // Resolve default props. Taken from ReactElement
    const props = Object.assign({}, baseProps);
    const defaultProps = Component.defaultProps;
    for (const propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
    return props;
  }
  return baseProps;
}

function getInternalReactConstants(version) {
  var ReactTypeOfWork;
  var ReactSymbols;
  var ReactTypeOfSideEffect;

  // **********************************************************
  // The section below is copied from files in React repo.
  // Keep it in sync, and add version guards if it changes.
  // **********************************************************
  if (semver.gte(version, '16.6.0-beta.0')) {
    ReactTypeOfWork = {
      ClassComponent: 1,
      ContextConsumer: 9,
      ContextProvider: 10,
      CoroutineComponent: -1, // Removed
      CoroutineHandlerPhase: -1, // Removed
      ForwardRef: 11,
      Fragment: 7,
      FunctionComponent: 0,
      HostComponent: 5,
      HostPortal: 4,
      HostRoot: 3,
      HostText: 6,
      IncompleteClassComponent: 17,
      IndeterminateComponent: 2,
      LazyComponent: 16,
      MemoComponent: 14,
      Mode: 8,
      Profiler: 12,
      SimpleMemoComponent: 15,
      SuspenseComponent: 13,
      YieldComponent: -1, // Removed
    };
  } else if (semver.gte(version, '16.4.3-alpha')) {
    ReactTypeOfWork = {
      ClassComponent: 2,
      ContextConsumer: 11,
      ContextProvider: 12,
      CoroutineComponent: -1, // Removed
      CoroutineHandlerPhase: -1, // Removed
      ForwardRef: 13,
      Fragment: 9,
      FunctionComponent: 0,
      HostComponent: 7,
      HostPortal: 6,
      HostRoot: 5,
      HostText: 8,
      IncompleteClassComponent: -1, // Doesn't exist yet
      IndeterminateComponent: 4,
      LazyComponent: -1, // Doesn't exist yet
      MemoComponent: -1, // Doesn't exist yet
      Mode: 10,
      Profiler: 15,
      SimpleMemoComponent: -1, // Doesn't exist yet
      SuspenseComponent: 16,
      YieldComponent: -1, // Removed
    };
  } else {
    ReactTypeOfWork = {
      ClassComponent: 2,
      ContextConsumer: 12,
      ContextProvider: 13,
      CoroutineComponent: 7,
      CoroutineHandlerPhase: 8,
      ForwardRef: 14,
      Fragment: 10,
      FunctionComponent: 1,
      HostComponent: 5,
      HostPortal: 4,
      HostRoot: 3,
      HostText: 6,
      IncompleteClassComponent: -1, // Doesn't exist yet
      IndeterminateComponent: 0,
      LazyComponent: -1, // Doesn't exist yet
      MemoComponent: -1, // Doesn't exist yet
      Mode: 11,
      Profiler: 15,
      SimpleMemoComponent: -1, // Doesn't exist yet
      SuspenseComponent: 16,
      YieldComponent: 9,
    };
  }
  ReactSymbols = {
    CONCURRENT_MODE_NUMBER: 0xeacf,
    CONCURRENT_MODE_SYMBOL_STRING: 'Symbol(react.concurrent_mode)',
    DEPRECATED_ASYNC_MODE_SYMBOL_STRING: 'Symbol(react.async_mode)',
    CONTEXT_CONSUMER_NUMBER: 0xeace,
    CONTEXT_CONSUMER_SYMBOL_STRING: 'Symbol(react.context)',
    CONTEXT_PROVIDER_NUMBER: 0xeacd,
    CONTEXT_PROVIDER_SYMBOL_STRING: 'Symbol(react.provider)',
    FORWARD_REF_NUMBER: 0xead0,
    FORWARD_REF_SYMBOL_STRING: 'Symbol(react.forward_ref)',
    MEMO_NUMBER: 0xead3,
    MEMO_SYMBOL_STRING: 'Symbol(react.memo)',
    PROFILER_NUMBER: 0xead2,
    PROFILER_SYMBOL_STRING: 'Symbol(react.profiler)',
    STRICT_MODE_NUMBER: 0xeacc,
    STRICT_MODE_SYMBOL_STRING: 'Symbol(react.strict_mode)',
    SUSPENSE_NUMBER: 0xead1,
    SUSPENSE_SYMBOL_STRING: 'Symbol(react.suspense)',
    DEPRECATED_PLACEHOLDER_SYMBOL_STRING: 'Symbol(react.placeholder)',
  };
  ReactTypeOfSideEffect = {
    PerformedWork: 1,
  };
  // **********************************************************
  // End of copied code.
  // **********************************************************

  return {
    ReactTypeOfWork,
    ReactSymbols,
    ReactTypeOfSideEffect,
  };
}

function attachRendererFiber(hook: Hook, rid: string, renderer: ReactRenderer): Helpers {
  var {overrideProps} = renderer;
  var {ReactTypeOfWork, ReactSymbols, ReactTypeOfSideEffect} = getInternalReactConstants(renderer.version);
  var {PerformedWork} = ReactTypeOfSideEffect;
  var {
    FunctionComponent,
    ClassComponent,
    ContextConsumer,
    Fragment,
    ForwardRef,
    HostRoot,
    HostPortal,
    HostComponent,
    HostText,
    IncompleteClassComponent,
    IndeterminateComponent,
    MemoComponent,
    SimpleMemoComponent,
  } = ReactTypeOfWork;
  var {
    CONCURRENT_MODE_NUMBER,
    CONCURRENT_MODE_SYMBOL_STRING,
    DEPRECATED_ASYNC_MODE_SYMBOL_STRING,
    CONTEXT_CONSUMER_NUMBER,
    CONTEXT_CONSUMER_SYMBOL_STRING,
    CONTEXT_PROVIDER_NUMBER,
    CONTEXT_PROVIDER_SYMBOL_STRING,
    PROFILER_NUMBER,
    PROFILER_SYMBOL_STRING,
    STRICT_MODE_NUMBER,
    STRICT_MODE_SYMBOL_STRING,
    SUSPENSE_NUMBER,
    SUSPENSE_SYMBOL_STRING,
    DEPRECATED_PLACEHOLDER_SYMBOL_STRING,
  } = ReactSymbols;

  // TODO: we might want to change the data structure
  // once we no longer support Stack versions of `getData`.
  function getDataFiber(fiber: Object): DataType {
    var elementType = fiber.elementType;
    var type = fiber.type;
    var key = fiber.key;
    var ref = fiber.ref;
    var tag = fiber.tag;
    var source = fiber._debugSource;
    var publicInstance = null;
    var props = null;
    var state = null;
    var children = null;
    var context = null;
    var updater = null;
    var nodeType = null;
    var name = null;
    var text = null;
    var resolvedContext = null;

    // Tracing
    var memoizedInteractions = null;

    // Profiler
    var actualDuration = null;
    var actualStartTime = null;
    var treeBaseDuration = null;

    // Suspense
    var isTimedOutSuspense = false;

    // Hooks inspection
    var containsHooks =
      (tag === FunctionComponent ||
        tag === SimpleMemoComponent ||
        tag === ForwardRef) &&
      !!fiber.memoizedState;

    var resolvedType = type;
    if (typeof type === 'object' && type !== null) {
      if (typeof type.then === 'function') {
        resolvedType = type._reactResult;
      }
    }

    if (typeof overrideProps === 'function') {
      updater = {
        canUpdate: true,
        setState: null,
        setInProps: overrideProps.bind(null, fiber),
        setInState: null,
        setInContext: null,
      };
    }

    switch (tag) {
      case ClassComponent:
      case FunctionComponent:
      case IncompleteClassComponent:
      case IndeterminateComponent:
        nodeType = 'Composite';
        name = getDisplayName(resolvedType);
        publicInstance = fiber.stateNode;
        props = fiber.memoizedProps;
        state = fiber.memoizedState;
        if (publicInstance != null) {
          context = publicInstance.context;
          if (context && Object.keys(context).length === 0) {
            context = null;
          }
        }
        const inst = publicInstance;
        if (inst) {
          updater = {
            canUpdate: true,
            setState: inst.setState && inst.setState.bind(inst),
            setInProps: inst.forceUpdate && setInProps.bind(null, fiber),
            setInState: inst.forceUpdate && setInState.bind(null, inst),
            setInContext: inst.forceUpdate && setInContext.bind(null, inst),
          };
        }
        children = [];
        break;
      case ForwardRef:
        const functionName = getDisplayName(resolvedType.render, '');
        nodeType = 'Special';
        name = resolvedType.displayName || (
          functionName !== ''
            ? `ForwardRef(${functionName})`
            : 'ForwardRef'
        );
        props = fiber.memoizedProps;
        state = fiber.memoizedState;
        children = [];
        break;
      case HostRoot:
        nodeType = 'Wrapper';
        children = [];
        memoizedInteractions = fiber.stateNode.memoizedInteractions;
        break;
      case HostPortal:
        nodeType = 'Portal';
        name = 'ReactPortal';
        props = {
          target: fiber.stateNode.containerInfo,
        };
        children = [];
        break;
      case HostComponent:
        nodeType = 'Native';
        name = fiber.type;

        // TODO (bvaughn) we plan to remove this prefix anyway.
        // We can cut this special case out when it's gone.
        name = name.replace('topsecret-', '');

        publicInstance = fiber.stateNode;
        props = fiber.memoizedProps;
        if (
          typeof props.children === 'string' ||
          typeof props.children === 'number'
        ) {
          children = props.children.toString();
        } else {
          children = [];
        }
        if (typeof fiber.stateNode.setNativeProps === 'function') {
          // For editing styles in RN
          updater = {
            setNativeProps(nativeProps) {
              fiber.stateNode.setNativeProps(nativeProps);
            },
          };
        }
        break;
      case HostText:
        nodeType = 'Text';
        publicInstance = fiber.stateNode;
        text = fiber.memoizedProps;
        break;
      case Fragment:
        nodeType = 'Wrapper';
        children = [];
        break;
      case MemoComponent:
      case SimpleMemoComponent:
        nodeType = 'Composite';
        if (elementType.displayName) {
          name = elementType.displayName;
        } else {
          const displayName = type.displayName || type.name;
          name = displayName ? `Memo(${displayName})` : 'Memo';
        }
        props = fiber.memoizedProps;
        state = fiber.memoizedState;
        children = [];
        break;
      default:
        const symbolOrNumber = typeof type === 'object' && type !== null
          ? type.$$typeof
          : type;
        // $FlowFixMe facebook/flow/issues/2362
        const switchValue = typeof symbolOrNumber === 'symbol'
          ? symbolOrNumber.toString()
          : symbolOrNumber;

        switch (switchValue) {
          case CONCURRENT_MODE_NUMBER:
          case CONCURRENT_MODE_SYMBOL_STRING:
          case DEPRECATED_ASYNC_MODE_SYMBOL_STRING:
            nodeType = 'Special';
            name = 'ConcurrentMode';
            children = [];
            break;
          case CONTEXT_PROVIDER_NUMBER:
          case CONTEXT_PROVIDER_SYMBOL_STRING:
            nodeType = 'Special';
            props = fiber.memoizedProps;

            // 16.3.0 exposed the context object as "context"
            // PR #12501 changed it to "_context" for 16.3.1+
            resolvedContext = fiber.type._context || fiber.type.context;

            name = `${resolvedContext.displayName || 'Context'}.Provider`;
            children = [];
            break;
          case CONTEXT_CONSUMER_NUMBER:
          case CONTEXT_CONSUMER_SYMBOL_STRING:
            nodeType = 'Special';
            props = fiber.memoizedProps;

            // 16.3-16.5 read from "type" because the Consumer is the actual context object.
            // 16.6+ should read from "type._context" because Consumer can be different (in DEV).
            resolvedContext = fiber.type._context || fiber.type;

            // NOTE: TraceUpdatesBackendManager depends on the name ending in '.Consumer'
            // If you change the name, figure out a more resilient way to detect it.
            name = `${resolvedContext.displayName || 'Context'}.Consumer`;
            children = [];
            break;
          case STRICT_MODE_NUMBER:
          case STRICT_MODE_SYMBOL_STRING:
            nodeType = 'Special';
            name = 'StrictMode';
            children = [];
            break;
          case SUSPENSE_NUMBER:
          case SUSPENSE_SYMBOL_STRING:
          case DEPRECATED_PLACEHOLDER_SYMBOL_STRING:
            nodeType = 'Special';
            name = 'Suspense';
            props = fiber.memoizedProps;
            children = [];

            // Suspense components only have a non-null memoizedState if they're timed-out.
            isTimedOutSuspense = fiber.memoizedState !== null;
            break;
          case PROFILER_NUMBER:
          case PROFILER_SYMBOL_STRING:
            nodeType = 'Special';
            props = fiber.memoizedProps;
            name = `Profiler(${fiber.memoizedProps.id})`;
            children = [];
            break;
          default:
            nodeType = 'Native';
            props = fiber.memoizedProps;
            name = 'TODO_NOT_IMPLEMENTED_YET';
            children = [];
            break;
        }
        break;
    }

    if (
      props !== null &&
      typeof fiber.elementType !== undefined &&
      fiber.type !== fiber.elementType
    ) {
      props = resolveDefaultProps(fiber.type, props);
    }

    if (Array.isArray(children)) {
      if (isTimedOutSuspense) {
        // The behavior of timed-out Suspense trees is unique.
        // Rather than unmount the timed out content (and possibly lose important state),
        // React re-parents this content within a hidden Fragment while the fallback is showing.
        // This behavior doesn't need to be observable in the DevTools though.
        // It might even result in a bad user experience for e.g. node selection in the Elements panel.
        // The easiest fix is to strip out the intermediate Fragment fibers,
        // so the Elements panel and Profiler don't need to special case them.
        const primaryChildFragment = fiber.child;
        const primaryChild = primaryChildFragment.child;
        const fallbackChildFragment = primaryChildFragment.sibling;
        const fallbackChild = fallbackChildFragment.child;
        children.push(primaryChild);
        children.push(fallbackChild);
      } else {
        let child = fiber.child;
        while (child) {
          children.push(getOpaqueNode(child));
          child = child.sibling;
        }
      }
    }

    if (fiber.actualDuration !== undefined) {
      actualDuration = fiber.actualDuration;
      actualStartTime = fiber.actualStartTime;
      treeBaseDuration = fiber.treeBaseDuration;
    }

    if (publicInstance === null) {
      // publicInstance is used for $r.
      // If we have nothing useful to expose, at least give props and state.
      // This is an escape hatch to avoid a situation where there is useful
      // data in the tree but DevTools don't offer any way to get it through console.
      publicInstance = { props, state, type };
    }

    // $FlowFixMe
    return {
      nodeType,
      type,
      key,
      ref,
      source,
      name,
      props,
      state,
      context,
      children,
      text,
      updater,
      publicInstance,

      // Tracing
      memoizedInteractions,

      // Profiler data
      actualDuration,
      actualStartTime,
      treeBaseDuration,

      // Hooks inspection
      containsHooks,
    };
  }

  function setInProps(fiber, path: Array<string | number>, value: any) {
    const inst = fiber.stateNode;
    fiber.pendingProps = copyWithSet(inst.props, path, value);
    if (fiber.alternate) {
      // We don't know which fiber is the current one because DevTools may bail out of getDataFiber() call,
      // and so the data object may refer to another version of the fiber. Therefore we update pendingProps
      // on both. I hope that this is safe.
      fiber.alternate.pendingProps = fiber.pendingProps;
    }
    fiber.stateNode.forceUpdate();
  }

  function setInState(inst, path: Array<string | number>, value: any) {
    setIn(inst.state, path, value);
    inst.forceUpdate();
  }

  function setInContext(inst, path: Array<string | number>, value: any) {
    setIn(inst.context, path, value);
    inst.forceUpdate();
  }

  function setIn(obj: Object, path: Array<string | number>, value: any) {
    var last = path.pop();
    var parent = path.reduce((obj_, attr) => obj_ ? obj_[attr] : null, obj);
    if (parent) {
      parent[last] = value;
    }
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

  function hasDataChanged(prevFiber, nextFiber) {
    switch (nextFiber.tag) {
      case ClassComponent:
      case FunctionComponent:
      case ContextConsumer:
      case MemoComponent:
      case SimpleMemoComponent:
        // For types that execute user code, we check PerformedWork effect.
        // We don't reflect bailouts (either referential or sCU) in DevTools.
        // eslint-disable-next-line no-bitwise
        return (nextFiber.effectTag & PerformedWork) === PerformedWork;
        // Note: ContextConsumer only gets PerformedWork effect in 16.3.3+
        // so it won't get highlighted with React 16.3.0 to 16.3.2.
      default:
        // For host components and other types, we compare inputs
        // to determine whether something is an update.
        return (
          prevFiber.memoizedProps !== nextFiber.memoizedProps ||
          prevFiber.memoizedState !== nextFiber.memoizedState ||
          prevFiber.ref !== nextFiber.ref
        );
    }
  }

  function haveProfilerTimesChanged(prevFiber, nextFiber) {
    return (
      prevFiber.actualDuration !== undefined && // Short-circuit check for non-profiling builds
      (
        prevFiber.actualDuration !== nextFiber.actualDuration ||
        prevFiber.actualStartTime !== nextFiber.actualStartTime ||
        prevFiber.treeBaseDuration !== nextFiber.treeBaseDuration
      )
    );
  }

  let pendingEvents = [];

  function flushPendingEvents() {
    const events = pendingEvents;
    pendingEvents = [];
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      hook.emit(event.type, event);
    }
  }

  function enqueueMount(fiber) {
    pendingEvents.push({
      internalInstance: getOpaqueNode(fiber),
      data: getDataFiber(fiber),
      renderer: rid,
      type: 'mount',
    });

    const isRoot = fiber.tag === HostRoot;
    if (isRoot) {
      pendingEvents.push({
        internalInstance: getOpaqueNode(fiber),
        renderer: rid,
        type: 'root',
      });
    }
  }

  function enqueueUpdateIfNecessary(fiber, hasChildOrderChanged) {
    const data = getDataFiber(fiber);

    if (
      !hasChildOrderChanged &&
      !hasDataChanged(fiber.alternate, fiber)
    ) {
      // If only timing information has changed, we still need to update the nodes.
      // But we can do it in a faster way since we know it's safe to skip the children.
      // It's also important to avoid emitting an "update" signal for the node in this case,
      // Since that would indicate to the Profiler that it was part of the "commit" when it wasn't.
      if (haveProfilerTimesChanged(fiber.alternate, fiber)) {
        pendingEvents.push({
          internalInstance: getOpaqueNode(fiber),
          data,
          renderer: rid,
          type: 'updateProfileTimes',
        });
      }
      return;
    }
    pendingEvents.push({
      internalInstance: getOpaqueNode(fiber),
      data,
      renderer: rid,
      type: 'update',
    });
  }

  function enqueueUnmount(fiber) {
    const isRoot = fiber.tag === HostRoot;
    const opaqueNode = getOpaqueNode(fiber);
    const event = {
      internalInstance: opaqueNode,
      renderer: rid,
      type: 'unmount',
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
    opaqueNodes.delete(opaqueNode);
  }

  function markRootCommitted(fiber) {
    pendingEvents.push({
      internalInstance: getOpaqueNode(fiber),
      data: getDataFiber(fiber),
      renderer: rid,
      type: 'rootCommitted',
    });
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
    // Suspense components only have a non-null memoizedState if they're timed-out.
    const isTimedOutSuspense = (
      nextFiber.tag === ReactTypeOfWork.SuspenseComponent &&
      nextFiber.memoizedState !== null
    );

    if (isTimedOutSuspense) {
      // The behavior of timed-out Suspense trees is unique.
      // Rather than unmount the timed out content (and possibly lose important state),
      // React re-parents this content within a hidden Fragment while the fallback is showing.
      // This behavior doesn't need to be observable in the DevTools though.
      // It might even result in a bad user experience for e.g. node selection in the Elements panel.
      // The easiest fix is to strip out the intermediate Fragment fibers,
      // so the Elements panel and Profiler don't need to special case them.
      const primaryChildFragment = nextFiber.child;
      const fallbackChildFragment = primaryChildFragment.sibling;
      const fallbackChild = fallbackChildFragment.child;
      // The primary, hidden child is never actually updated in this case,
      // so we can skip any updates to its tree.
      // We only need to track updates to the Fallback UI for now.
      if (fallbackChild.alternate) {
        updateFiber(fallbackChild, fallbackChild.alternate);
      } else {
        mountFiber(fallbackChild);
      }
      enqueueUpdateIfNecessary(nextFiber, false);
    } else {
      let hasChildOrderChanged = false;
      if (nextFiber.child !== prevFiber.child) {
        // If the first child is different, we need to traverse them.
        // Each next child will be either a new child (mount) or an alternate (update).
        let nextChild = nextFiber.child;
        let prevChildAtSameIndex = prevFiber.child;
        while (nextChild) {
          // We already know children will be referentially different because
          // they are either new mounts or alternates of previous children.
          // Schedule updates and mounts depending on whether alternates exist.
          // We don't track deletions here because they are reported separately.
          if (nextChild.alternate) {
            const prevChild = nextChild.alternate;
            updateFiber(nextChild, prevChild);
            // However we also keep track if the order of the children matches
            // the previous order. They are always different referentially, but
            // if the instances line up conceptually we'll want to know that.
            if (!hasChildOrderChanged && prevChild !== prevChildAtSameIndex) {
              hasChildOrderChanged = true;
            }
          } else {
            mountFiber(nextChild);
            if (!hasChildOrderChanged) {
              hasChildOrderChanged = true;
            }
          }
          // Try the next child.
          nextChild = nextChild.sibling;
          // Advance the pointer in the previous list so that we can
          // keep comparing if they line up.
          if (!hasChildOrderChanged && prevChildAtSameIndex != null) {
            prevChildAtSameIndex = prevChildAtSameIndex.sibling;
          }
        }
        // If we have no more children, but used to, they don't line up.
        if (!hasChildOrderChanged && prevChildAtSameIndex != null) {
          hasChildOrderChanged = true;
        }
      }
      enqueueUpdateIfNecessary(nextFiber, hasChildOrderChanged);
    }
  }

  function walkTree() {
    hook.getFiberRoots(rid).forEach(root => {
      // Hydrate all the roots for the first time.
      mountFiber(root.current);
      markRootCommitted(root.current);
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
    markRootCommitted(current);
    // We're done here.
    flushPendingEvents();
  }

  // The naming is confusing.
  // They deal with opaque nodes (fibers), not elements.
  function getNativeFromReactElement(fiber) {
    try {
      const opaqueNode = fiber;
      const hostInstance = renderer.findHostInstanceByFiber(opaqueNode);
      return hostInstance;
    } catch (err) {
      // The fiber might have unmounted by now.
      return null;
    }
  }
  function getReactElementFromNative(hostInstance) {
    const fiber = renderer.findFiberByHostInstance(hostInstance);
    if (fiber != null) {
      // TODO: type fibers.
      const opaqueNode = getOpaqueNode((fiber: any));
      return opaqueNode;
    }
    return null;
  }

  return {
    getNativeFromReactElement,
    getReactElementFromNative,
    handleCommitFiberRoot,
    handleCommitFiberUnmount,
    cleanup,
    walkTree,
    renderer,
  };
}

module.exports = attachRendererFiber;
