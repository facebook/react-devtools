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

import type {DataType, OpaqueReactElement, NativeType, Hook, ReactRenderer, Helpers} from './types';
var getData = require('./getData');
var getData012 = require('./getData012');

type NodeLike = {};

function attachRenderer(hook: Hook, rid: string, renderer: ReactRenderer): Helpers {
  var rootNodeIDMap = new Map();
  var extras = {};
  var is012 = !renderer.Reconciler;

  // RN to React differences
  if (renderer.Mount.findNodeHandle && renderer.Mount.nativeTagToRootNodeID) {
    extras.getNativeFromReactElement = function (component) {
      return renderer.Mount.findNodeHandle(component);
    };

    extras.getReactElementFromNative = function (nativeTag) {
      var id = renderer.Mount.nativeTagToRootNodeID(nativeTag);
      return rootNodeIDMap.get(id);
    };
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
    };
  } else {
    console.warn('Unknown react version (does not have getID), probably an unshimmed React Native');
  }

  var oldMethods;
  var oldRenderComponent;
  var oldRenderRoot;

  // React DOM
  if (renderer.Mount._renderNewRootComponent) {
    oldRenderRoot = decorateResult(renderer.Mount, '_renderNewRootComponent', (element) => {
      hook.emit('root', {renderer: rid, element});
    });
  // React Native
  } else if (renderer.Mount.renderComponent) {
    oldRenderComponent = decorateResult(renderer.Mount, 'renderComponent', element => {
      hook.emit('root', {renderer: rid, element: element._reactInternalInstance});
    });
  }

  if (renderer.Component) {
    console.error('You are using a version of React with limited support in this version of the devtools.\nPlease upgrade to use at least 0.13, or you can downgrade to use the old version of the devtools:\ninstructions here https://github.com/facebook/react-devtools/tree/devtools-next#how-do-i-use-this-for-react--013');
    // 0.11 - 0.12
    // $FlowFixMe renderer.Component is not "possibly undefined"
    oldMethods = decorateMany(renderer.Component.Mixin, {
      mountComponent() {
        var data = getData012(this, {});
        rootNodeIDMap.set(this._rootNodeID, this);
        hook.emit('mount', {element: this, data, renderer: rid});
      },
      updateComponent() {
        console.log('updating', this);
        hook.emit('update', {element: this, data: getData012(this, {}), renderer: rid});
      },
      unmountComponent() {
        hook.emit('unmount', {element: this, renderer: rid});
        rootNodeIDMap.delete(this._rootNodeID, this);
      },
    });
  } else if (renderer.Reconciler) {
    oldMethods = decorateMany(renderer.Reconciler, {
      mountComponent(element, rootID, transaction, context) {
        var data = getData(element, context);
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
        rootNodeIDMap.delete(element._rootNodeID, element);
      }
    });
  }

  extras.walkTree = function (visit: (component: OpaqueReactElement, data: DataType) => void, visitRoot: (element: OpaqueReactElement) => void) {
    var onMount = (component, data) => {
      rootNodeIDMap.set(component._rootNodeID, component);
      visit(component, data);
    };
    walkRoots(renderer.Mount._instancesByReactRootID || renderer.Mount._instancesByContainerID, onMount, visitRoot, is012);
  };

  extras.cleanup = function () {
    if (oldMethods) {
      if (renderer.Component) {
        restoreMany(renderer.Component.Mixin, oldMethods);
      } else {
        restoreMany(renderer.Reconciler, oldMethods);
      }
    }
    if (oldRenderRoot) {
      renderer.Mount._renderNewRootComponent = oldRenderRoot;
    }
    if (oldRenderComponent) {
      renderer.Mount.renderComponent = oldRenderComponent;
    }
    oldMethods = null;
    oldRenderRoot = null;
    oldRenderComponent = null;
  };

  return extras;
}

function walkRoots(roots, onMount, onRoot, is012) {
  for (var name in roots) {
    walkNode(roots[name], onMount, is012);
    onRoot(roots[name]);
  }
}

function walkNode(element, onMount, is012) {
  var data = is012 ? getData012(element) : getData(element);
  if (data.children && Array.isArray(data.children)) {
    data.children.forEach(child => walkNode(child, onMount, is012));
  }
  onMount(element, data);
}

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

module.exports = attachRenderer;
