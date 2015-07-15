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
 * This is the chrome devtools
 *
 * 1. Devtools sets the __REACT_DEVTOOLS_GLOBAL_HOOK__ global.
 * 2. React (if present) calls .inject() with the internal renderer
 * 3. Devtools sees the renderer, and then adds this actor, along with the Agent
 *    and whatever else is needed.
 * 4. The backend sets itself as .backend ... although is this now needed?
 * 5. It then calls `.emit('react-devtools', actor)`
 *
 * Now things are hooked up.
 *
 * When devtools closes, it calls `removeDevtools()` to remove the listeners
 * and any overhead caused by the backend.
 */
'use strict';

import type {DataType, OpaqueReactElement, NativeType} from './types';

type AnyFn = (...args: Array<any>) => any;

type ReactRenderer = {
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
};

type Helpers = {
  getNativeFromReactElement?: ?(component: OpaqueReactElement) => ?NativeType,
  getReactElementFromNative?: ?(component: NativeType) => ?OpaqueReactElement,
  walkTree: (visit: (component: OpaqueReactElement, data: DataType) => void, visitRoot: (element: OpaqueReactElement) => void) => void,
  cleanup: () => void,
};

type Hook = {
  _renderers: {[key: string]: ReactRenderer},
  helpers: {[key: string]: Helpers},
  on: (evt: string, handler: (data: any) => void) => void,
  off: (evt: string, handler: (data: any) => void) => void,
  emit: (evt: string, data: any) => void,
};

/**
 * Normal names
 */
module.exports = function backend(hook: Hook): boolean {
  if (!hook) {
    return false;
  }
  for (var id in hook._renderers) {
    hook.helpers[id] = attachRenderer(hook, id, hook._renderers[id]);
    hook.emit('renderer-attached', {id, renderer: hook._renderers[id], helpers: hook.helpers[id]});
  }

  hook.on('renderer', ({id, renderer}) => {
    hook.helpers[id] = attachRenderer(hook, id, renderer);
    hook.emit('renderer-attached', {id, renderer, helpers: hook.helpers[id]});
  });

  var shutdown = () => {
    for (var id in hook.helpers) {
      hook.helpers[id].cleanup();
    }
    hook.off('shutdown', shutdown);
  };
  hook.on('shutdown', shutdown);

  return true;
}

function attachRenderer(hook: Hook, rid: string, renderer: ReactRenderer): Helpers {
  var rootNodeIDMap = new Map();
  var extras = {};

  // RN to React differences
  if (renderer.Mount.findNodeHandle && renderer.Mount.nativeTagToRootNodeID) {
    extras.getNativeFromReactElement = function (component) {
      return renderer.Mount.findNodeHandle(component);
    };

    extras.getReactElementFromNative = function (nativeTag) {
      var id = renderer.Mount.nativeTagToRootNodeID(nativeTag);
      return rootNodeIDMap.get(id);
    }
  } else if (renderer.Mount.getID && renderer.Mount.getNode) {
    extras.getNativeFromReactElement = function (component) {
      try {
        return renderer.Mount.getNode(component._rootNodeID);
      } catch (e) {}
    };

    extras.getReactElementFromNative = function (node) {
      var id = renderer.Mount.getID(node);
      while (node && node.parentNode && !id) {
        node = node.parentNode;
        id = renderer.Mount.getID(node);
      }
      return rootNodeIDMap.get(id);
    }
  } else {
    console.warn('Unknown react version (does not have getID), probably an unshimmed React Native');
  }

  var oldMethods;
  var oldRenderComponent;
  var oldRenderNode;

  // React DOM
  if (renderer.Mount._renderNewRootComponent) {
    oldRenderNode = decorateResult(renderer.Mount, '_renderNewRootComponent', (element) => {
      hook.emit('root', {renderer: rid, element});
    });
  // React Native
  } else if (renderer.Mount.renderComponent) {
    // $FlowFixMe flow doesn't understand that renderer.Mount has
    // renderComponent in this branch
    oldRenderComponent = decorateResult(renderer.Mount, 'renderComponent', element => {
      hook.emit('root', {renderer: rid, element: element._reactInternalInstance});
    });
  }

  oldMethods = decorateMany(renderer.Reconciler, {
    mountComponent(element, rootID, transaction, context) {
      var data = getData(element, context)
      rootNodeIDMap.set(element._rootNodeID, element);
      hook.emit('mount', {element, data, renderer: rid});
    },
    performUpdateIfNecessary(element, nextChild, transaction, context) {
      hook.emit('update', {element, data: getData(element, context), renderer: rid});
    },
    receiveComponent(element, nextChild, transaction, context) {
      hook.emit('update', {element, data: getData(element, context), renderer: rid});
    },
    unmountComponent(element) {
      hook.emit('unmount', {element, renderer: rid});
    }
  });

  extras.walkTree = function (visit: (component: OpaqueReactElement, data: DataType) => void, visitRoot: (element: OpaqueReactElement) => void) {
    var onMount = (component, data) => {
      rootNodeIDMap.set(component._rootNodeID, component);
      visit(component, data);
    };
    walkRoots(renderer.Mount._instancesByReactRootID || renderer.Mount._instancesByContainerID, onMount, visitRoot);
  };

  extras.cleanup = function () {
    if (oldMethods) {
      restoreMany(renderer.Reconciler, oldMethods);
    }
    if (oldRenderNode) {
      renderer.Mount._renderNewRootComponent = oldRenderNode;
    }
    if (oldRenderComponent) {
      renderer.Mount.renderComponent = oldRenderComponent;
    }
    oldMethods = null;
    oldRenderNode = null;
    oldRenderComponent = null;
  }

  return extras;
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
      nodeType = 'Composite';
      name = element.getName();
      if (name === null) {
        nodeType = 'Wrapper';
      }
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
