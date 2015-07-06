/* @flow */

import type * as Backend from './'

module.exports = function (window: Object, backend: Backend): boolean {
  var hook = window.__REACT_DEVTOOLS_BACKEND__;
  if (!hook) {
    return false;
  }
  if (!hook.injectDevTools) {
    var success = compatify(window.__REACT_DEVTOOLS_GLOBAL_HOOK__, hook);
    if (!success) {
      return false;
    }
  }

  backend.setReactInternals({
    // getReactHandleFromNative: hook.getReactHandleFromNative,
    // getReactHandleFromElement: hook.getReactHandleFromElement,
    // getNativeFromHandle: hook.getNativeFromHandle,
    getNativeFromReactElement: hook.getNativeFromReactElement,
    getReactElementFromNative: hook.getReactElementFromNative,
    removeDevtools: hook.removeDevtools,
  });
  hook.injectDevTools(backend);
  hook.backend = backend;
  return true;
}

function compatify(oldHook, newHook) {
  if (!oldHook || !newHook || !oldHook._reactRuntime) {
    return false;
  }

  var runtime = oldHook._reactRuntime;
  var reconciler = runtime.Reconciler;
  var reactMount = runtime.Mount;
  var rootNodeIDMap = new Map();

  // RN to React differences
  if (runtime.Mount.findNodeHandle && runtime.Mount.nativeTagToRootNodeID) {
    newHook.getNativeFromReactElement = function (component) {
      return runtime.Mount.findNodeHandle(component);
    };

    newHook.getReactElementFromNative = function (nativeTag) {
      var id = runtime.Mount.nativeTagToRootNodeID(nativeTag);
      return rootNodeIDMap.get(id);
    }
  } else if (runtime.Mount.getID && runtime.Mount.getNode) {
    newHook.getNativeFromReactElement = function (component) {
      try {
        return runtime.Mount.getNode(component._rootNodeID);
      } catch (e) {}
    };

    newHook.getReactElementFromNative = function (node) {
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

  newHook.injectDevTools = function (backend) {
    if (runtime.Mount._renderNewRootComponent) {
      oldRenderNode = decorateResult(runtime.Mount, '_renderNewRootComponent', (element) => {
        backend.addRoot(element);
      });
    } else if (runtime.Mount.renderComponent) { // React Native
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

function getData(element) {
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

  if (name === null) {
    debugger
  }


  if (element._instance) {
    var inst = element._instance
    updater = {
      setState: inst.setState && inst.setState.bind(inst),
      forceUpdate: inst.forceUpdate && inst.forceUpdate.bind(inst),
      publicInstance: inst,
    }
  }

  return {nodeType, props, state, context, children, updater, type, name, text};
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

