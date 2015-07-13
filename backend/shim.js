/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 *
 * Bring react 0.13/14 up to the interface that the new devtools want.
 *
 * Currently, react exposes itself on the global hook, including the Mount,
 * Reconciler, and other internal objects. This is undesirable, as it
 * restricts the ability to refactor react internals.
 *
 * This shim takes the current internals, and exposes instead a much less
 * intrusive interface.
 *
 * This is the new handoff:
 *
 * 1. Devtools sets the __REACT_DEVTOOLS_BACKEND__ global.
 * 2. React (if present) sets 2 functions:
 *    - attachDevTools(backend) => void
 *    - removeDevtools() => void
 * 3. Devtools (if the 2 functions have been added), sets things up, creates
 * the backend instance, and calls `attachDevTools(backend)`
 *
 * Now things are hooked up.
 *
 * When devtools closes, it calls `removeDevtools()` to remove the listeners
 * and any overhead caused by the backend.
 */
'use strict';

type Internals = {
  getNativeFromReactElement: ?(component: ComponentType) => ?NativeType,
  getReactElementFromNative: ?(native: NativeType) => ?ComponentType,
  removeDevtools: () => void,
};

type Backend = {
  setReactInternals: (internals: Internals) => void,
  addRoot: (el: ComponentType) => void,
  onMounted: (el: ComponentType, data: DataType) => void,
  onUpdated: (el: ComponentType, data: DataType) => void,
  onUnmounted: (el: ComponentType) => void,
};

type DataType = {
  nodeType: 'Native' | 'Wrapper' | 'Custom' | 'Text' | 'Unknown',
  type: ?(string | Object),
  name: ?string,
  props: ?Object,
  state: ?Object,
  context: ?Object,
  children: ?(string | Array<Object>),
  text: ?string,
  updater: ?{
    setState: ?(newState: any) => void,
    forceUpdate: ?() => void,
    publicInstance: Object,
  },
};

type AnyFn = (...args: Array<any>) => any;

// This type is entirely opaque to the backend.
type ComponentType = {
  _rootNodeID: string,
};
type NativeType = {};

type OldStyleHook = {
  _reactRuntime: {
    Reconciler: {
      mountComponent: AnyFn,
      performUpdateIfNecessary: AnyFn,
      receiveComponent: AnyFn,
      unmountComponent: AnyFn,
    },
    // $FlowFixMe flow doesn't understand this tagged union
    Mount: Object /*{ // React Native
      nativeTagToRootNodeID: (tag: number) => string,
      findNodeHandle: (component: Object) => number,
      renderComponent: AnyFn,
      _instancesByContainerID: Object,
    } | { // React DOM
      getID: (node: DOMNode) => string,
      getNode: (id: string) => ?DOMNode,
      _instancesByReactRootID: Object,
      _renderNewRootComponent: AnyFn,
    },*/
  },
};

type NewStyleHook = {
  backend: Backend,
  attachDevTools: (backend: Backend) => void,
  removeDevtools: () => void,
};

module.exports = function shim(oldHook: OldStyleHook, newHook: NewStyleHook): boolean {
  if (!oldHook || !newHook || !oldHook._reactRuntime) {
    return false;
  }

  var runtime = oldHook._reactRuntime;
  var rootNodeIDMap = new Map();
  var getNativeFromReactElement;
  var getReactElementFromNative;

  // RN to React differences
  if (runtime.Mount.findNodeHandle && runtime.Mount.nativeTagToRootNodeID) {
    getNativeFromReactElement = function (component) {
      return runtime.Mount.findNodeHandle(component);
    };

    getReactElementFromNative = function (nativeTag) {
      var id = runtime.Mount.nativeTagToRootNodeID(nativeTag);
      return rootNodeIDMap.get(id);
    }
  } else if (runtime.Mount.getID && runtime.Mount.getNode) {
    getNativeFromReactElement = function (component) {
      try {
        return runtime.Mount.getNode(component._rootNodeID);
      } catch (e) {}
    };

    getReactElementFromNative = function (node) {
      var id = runtime.Mount.getID(node);
      while (node && node.parentNode && !id) {
        node = node.parentNode;
        id = runtime.Mount.getID(node);
      }
      return rootNodeIDMap.get(id);
    }
  } else {
    console.warn('Unknown react version (does not have getID), probably an unshimmed React Native');
  }

  var oldMethods;
  var oldRenderNode;
  var oldRenderComponent;

  newHook.attachDevTools = function (backend) {
    backend.setReactInternals({
      getNativeFromReactElement,
      getReactElementFromNative,
      removeDevtools: newHook.removeDevtools,
    });

    // React DOM
    if (runtime.Mount._renderNewRootComponent) {
      oldRenderNode = decorateResult(runtime.Mount, '_renderNewRootComponent', (element) => {
        backend.addRoot(element);
      });
    // React Native
    } else if (runtime.Mount.renderComponent) {
      // $FlowFixMe flow doesn't understand that runtime.Mount has
      // renderComponent in this branch
      oldRenderComponent = decorateResult(runtime.Mount, 'renderComponent', element => {
        backend.addRoot(element._reactInternalInstance);
      });
    }

    oldMethods = decorateMany(runtime.Reconciler, {
      mountComponent(element, rootID, transaction, context) {
        var data = getData(element, context)
        rootNodeIDMap.set(element._rootNodeID, element);
        backend.onMounted(element, data);
      },
      performUpdateIfNecessary(element, nextChild, transaction, context) {
        backend.onUpdated(element, getData(element, context));
      },
      receiveComponent(element, nextChild, transaction, context) {
        backend.onUpdated(element, getData(element, context));
      },
      unmountComponent(element) {
        backend.onUnmounted(element);
      }
    });

    var onMount = (component, data) => {
      rootNodeIDMap.set(component._rootNodeID, component);
      backend.onMounted(component, data);
    };
    var onRoot = backend.addRoot.bind(backend);
    walkRoots(runtime.Mount._instancesByReactRootID || runtime.Mount._instancesByContainerID, onMount, onRoot);
  }

  newHook.removeDevtools = function () {
    if (oldMethods) {
      restoreMany(runtime.Reconciler, oldMethods);
    }
    if (oldRenderNode) {
      runtime.Mount._renderNewRootComponent = oldRenderNode;
    }
    if (oldRenderComponent) {
      runtime.Mount.renderComponent = oldRenderComponent;
    }
    oldMethods = null;
    oldRenderNode = null;
    oldRenderComponent = null;
  }

  return true;
}

function walkRoots(roots, onMount, onRoot) {
  for (var name in roots) {
    walkNode(roots[name], onMount);
    onRoot(roots[name]);
  }
}

function walkNode(element, onMount) {
  var data = getData(element);
  if (data.children && Array.isArray(data.children)) {
    data.children.forEach(child => walkNode(child, onMount));
  }
  onMount(element, data);
}

function childrenList(children) {
  var res = [];
  for (var name in children) {
    res.push(children[name]);
  }
  return res;
}

function getData(element): DataType {
  var children = null;
  var props = null;
  var state = null;
  var context = null;
  var updater = null;
  var name = null;
  var type = null;
  var text = null;
  var nodeType = 'Native';
  if (element._renderedComponent) {
    nodeType = 'Wrapper';
    children = [element._renderedComponent];
    props = element._instance.props;
    state = element._instance.state;
    context = element._instance.context;
    if (context && Object.keys(context).length === 0) {
      context = null;
    }
  } else if (element._renderedChildren) {
    children = childrenList(element._renderedChildren);
  } else if (element._currentElement.props) {
    // string children
    children = element._currentElement.props.children
  }

  if (!props && element._currentElement && element._currentElement.props) {
    props = element._currentElement.props;
  }

  if (element._currentElement) {
    type = element._currentElement.type;
    if ('string' === typeof type) {
      name = type;
    } else if (element.getName) {
      nodeType = 'Custom';
      name = element.getName() || 'Unknown';
    } else if (element._stringText) {
      nodeType = 'Text';
      text = element._stringText;
    } else {
      name = type.displayName || type.name || 'Unknown';
    }
  }

  if (element._instance) {
    var inst = element._instance
    updater = {
      setState: inst.setState && inst.setState.bind(inst),
      forceUpdate: inst.forceUpdate && inst.forceUpdate.bind(inst),
      publicInstance: inst,
    }
  }

  return {
    nodeType,
    type,
    name,
    props,
    state,
    context,
    children,
    text,
    updater,
  };
}

type NodeLike = {
};

function decorateResult(obj, attr, fn) {
  var old = obj[attr];
  obj[attr] = function (instance: NodeLike) {
    var res = old.apply(this, arguments);
    fn(res);
    return res;
  };
  return old;
}

function decorate(obj, attr, fn) {
  var old = obj[attr];
  obj[attr] = function (instance: NodeLike) {
    var res = old.apply(this, arguments);
    fn.apply(this, arguments);
    return res;
  };
  return old;
}

function decorateMany(source, fns) {
  var olds = {};
  for (var name in fns) {
    olds[name] = decorate(source, name, fns[name]);
  }
  return olds;
}

function restoreMany(source, olds) {
  for (var name in olds) {
    source[name] = olds[name];
  }
}
