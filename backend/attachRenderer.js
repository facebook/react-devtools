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

import type {DataType, OpaqueNodeHandle, Hook, ReactRenderer, Helpers} from './types';
var getData = require('./getData');
var getData012 = require('./getData012');

type NodeLike = {};

/**
 * This takes care of patching the renderer to emit events on the global
 * `Hook`. The returned object has a `.cleanup` method to un-patch everything.
 */
function attachRenderer(hook: Hook, rid: string, renderer: ReactRenderer): Helpers {
  var rootNodeIDMap = new Map();
  var extras = {};
  // Before 0.13 there was no Reconciler, so we patch Component.Mixin
  var isPre013 = !renderer.Reconciler;

  // React Fiber
  if (renderer.getRoot) {
    extras.getNativeFromReactElement = function() {
      // TODO
      return null;
    };
    extras.getReactElementFromNative = function() {
      // TODO
      return null;
    };
    extras.cleanup = function() {
      // TODO
    };
    extras.walkTree = function() {
      // TODO: there can be more than one root
      // TODO: expose a normal API instead of monkeypatching
      const root = renderer.getRoot();
      let current = root.stateNode.current;
      Object.defineProperty(root.stateNode, 'current', {
        get() {
          return current;
        },
        set(nextCurrent) {
          current = nextCurrent;
          try {
            updateFiber(current, current.alternate);
          } catch (err) {
            console.error(err);
          }
        }
      });
      mountFiber(current);
      hook.emit('root', {
        element: current._debugID,
        renderer: rid
      });
    }

    function describe(fiber) {
      let data = {
        type: fiber.type,
        key: fiber.key,
        ref: fiber.ref,
        source: fiber._debugSource,
        props: fiber.memoizedProps,
        state: fiber.memoizedState,
        publicInstance: fiber.stateNode,
        children: [],
      };
      let child = fiber.child;
      while (child) {
        data.children.push(child._debugID);
        child = child.sibling;
      }
      switch (fiber.tag) {
        case 3:
          data.nodeType = 'Wrapper';
          break;
        case 1:
        case 2:
          data.nodeType = 'Composite';
          data.name = fiber.type.displayName || fiber.type.name;
          data.publicInstance = fiber.stateNode;
          data.updater = {
            // TODO
            setState() {},
            forceUpdate() {},
            setInProps() {},
            setInState() {},
            setInContext() {},
          };
          break;
        case 5:
          data.nodeType = 'Native';
          data.name = fiber.type;
          data.publicInstance = fiber.stateNode;
          if (
            typeof fiber.memoizedProps.children === 'string' ||
            typeof fiber.memoizedProps.children === 'number'
          ) {
            data.children = fiber.memoizedProps.children.toString();
          }
          break;
        case 6:
          data.nodeType = 'Text';
          data.text = fiber.memoizedProps;
          break;
        default:
          data.nodeType = 'Native';
          data.name = 'TODO_NOT_IMPLEMENTED_YET';
          break;
      }
      return data;
    }

    function mapChildren(parent, allKeys) {
      let children = new Map();
      let node = parent.child;
      while (node) {
        const key = node.key || node.index;
        allKeys.add(key);
        children.set(key, node);
        node = node.sibling;
      }
      return children;
    }

    function unmountFiber(fiber) {
      let node = fiber;
      outer: while (true) {
        if (node.child) {
          node.child.return = node;
          node = node.child;
          continue;
        }
        hook.emit('unmount', {
          element: node._debugID,
          renderer: rid
        });
        if (node.sibling) {
          node.sibling.return = node.return;
          node = node.sibling;
          continue;
        }
        if (node == fiber) {
          return;
        }
        while (node.return) {
          node = node.return;
          hook.emit('unmount', {
            element: node._debugID,
            renderer: rid
          });
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

    function mountFiber(fiber) {
      let node = fiber;
      outer: while (true) {
        if (node.child) {
          node.child.return = node;
          node = node.child;
          continue;
        }
        hook.emit('mount', {
          element: node._debugID,
          data: describe(node),
          renderer: rid
        });
        if (node.sibling) {
          node.sibling.return = node.return;
          node = node.sibling;
          continue;
        }
        if (node == fiber) {
          return;
        }
        while (node.return) {
          node = node.return;
          hook.emit('mount', {
            element: node._debugID,
            data: describe(node),
            renderer: rid
          });
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
      let allKeys = new Set();
      let prevChildren = mapChildren(prevFiber, allKeys);
      let nextChildren = mapChildren(nextFiber, allKeys);
      allKeys.forEach(key => {
        const prevChild = prevChildren.get(key);
        const nextChild = nextChildren.get(key);

        if (prevChild && !nextChild) {
          unmountFiber(prevChild);
        } else if (!prevChild && nextChild) {
          mountFiber(nextChild);
        } else if (prevChild !== nextChild) {
          updateFiber(nextChild, prevChild);
        }
      });
      hook.emit('update', {
        element: nextFiber._debugID,
        data: describe(nextFiber),
        renderer: rid
      });
    }

    return extras;
  }

  // React Native
  if (renderer.Mount.findNodeHandle && renderer.Mount.nativeTagToRootNodeID) {
    extras.getNativeFromReactElement = function(component) {
      return renderer.Mount.findNodeHandle(component);
    };

    extras.getReactElementFromNative = function(nativeTag) {
      var id = renderer.Mount.nativeTagToRootNodeID(nativeTag);
      return rootNodeIDMap.get(id);
    };
  // React DOM 15+
  } else if (renderer.ComponentTree) {
    extras.getNativeFromReactElement = function(component) {
      return renderer.ComponentTree.getNodeFromInstance(component);
    };

    extras.getReactElementFromNative = function(node) {
      return renderer.ComponentTree.getClosestInstanceFromNode(node);
    };
  // React DOM
  } else if (renderer.Mount.getID && renderer.Mount.getNode) {
    extras.getNativeFromReactElement = function(component) {
      try {
        return renderer.Mount.getNode(component._rootNodeID);
      } catch (e) {
        return undefined;
      }
    };

    extras.getReactElementFromNative = function(node) {
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
        rootNodeIDMap.set(this._rootNodeID, this);
        // FIXME DOMComponent calls Component.Mixin, and sets up the
        // `children` *after* that call, meaning we don't have access to the
        // children at this point. Maybe we should find something else to shim
        // (do we have access to DOMComponent here?) so that we don't have to
        // setTimeout.
        setTimeout(() => {
          hook.emit('mount', {element: this, data: getData012(this), renderer: rid});
        }, 0);
      },
      updateComponent() {
        setTimeout(() => {
          hook.emit('update', {element: this, data: getData012(this), renderer: rid});
        }, 0);
      },
      unmountComponent() {
        hook.emit('unmount', {element: this, renderer: rid});
        rootNodeIDMap.delete(this._rootNodeID, this);
      },
    });
  } else if (renderer.Reconciler) {
    oldMethods = decorateMany(renderer.Reconciler, {
      mountComponent(element, rootID, transaction, context) {
        var data = getData(element);
        rootNodeIDMap.set(element._rootNodeID, element);
        hook.emit('mount', {element, data, renderer: rid});
      },
      performUpdateIfNecessary(element, nextChild, transaction, context) {
        hook.emit('update', {element, data: getData(element), renderer: rid});
      },
      receiveComponent(element, nextChild, transaction, context) {
        hook.emit('update', {element, data: getData(element), renderer: rid});
      },
      unmountComponent(element) {
        hook.emit('unmount', {element, renderer: rid});
        rootNodeIDMap.delete(element._rootNodeID, element);
      },
    });
  }

  extras.walkTree = function(visit: (component: OpaqueNodeHandle, data: DataType) => void, visitRoot: (element: OpaqueNodeHandle) => void) {
    var onMount = (component, data) => {
      rootNodeIDMap.set(component._rootNodeID, component);
      visit(component, data);
    };
    walkRoots(renderer.Mount._instancesByReactRootID || renderer.Mount._instancesByContainerID, onMount, visitRoot, isPre013);
  };

  extras.cleanup = function() {
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

function walkRoots(roots, onMount, onRoot, isPre013) {
  for (var name in roots) {
    walkNode(roots[name], onMount, isPre013);
    onRoot(roots[name]);
  }
}

function walkNode(element, onMount, isPre013) {
  var data = isPre013 ? getData012(element) : getData(element);
  if (data.children && Array.isArray(data.children)) {
    data.children.forEach(child => walkNode(child, onMount, isPre013));
  }
  onMount(element, data);
}

function decorateResult(obj, attr, fn) {
  var old = obj[attr];
  obj[attr] = function(instance: NodeLike) {
    var res = old.apply(this, arguments);
    fn(res);
    return res;
  };
  return old;
}

function decorate(obj, attr, fn) {
  var old = obj[attr];
  obj[attr] = function(instance: NodeLike) {
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
