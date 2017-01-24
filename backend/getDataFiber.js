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

import type {DataType} from './types';

// TODO: we might want to change the data structure
// once we no longer suppport Stack versions of `getData`.
function getDataFiber(fiber: Object): DataType {
  var type = fiber.type;
  var key = fiber.key;
  var ref = fiber.ref;
  var source = fiber._debugSource;
  var publicInstance = null;
  var props = null;
  var state = null;
  var children = null;
  var context = null; // TODO
  var updater = null; // TODO
  var nodeType = null;
  var name = null;
  var text = null;

  switch (fiber.tag) {
    case 1: // FunctionalComponent
    case 2: // ClassComponent
      nodeType = 'Composite';
      name = fiber.type.displayName || fiber.type.name;
      publicInstance = fiber.stateNode;
      props = fiber.memoizedProps;
      state = fiber.memoizedState;
      if (publicInstance != null) {
        context = publicInstance.context;
        if (context && Object.keys(context).length === 0) {
          context = null;
        }
      }
      updater = {
        // TODO
        setState() {},
        forceUpdate() {},
        setInProps() {},
        setInState() {},
        setInContext() {},
      };
      children = [];
      break;
    case 3: // HostRoot
      nodeType = 'Wrapper';
      children = [];
      break;
    case 5: // HostComponent
      nodeType = 'Native';
      name = fiber.type;
      props = fiber.memoizedProps;
      if (
        typeof props.children === 'string' ||
        typeof props.children === 'number'
      ) {
        children = props.children.toString();
      } else {
        children = [];
      }
      break;
    case 6: // HostText
      nodeType = 'Text';
      text = fiber.memoizedProps;
      break;
    case 10: // Fragment
      nodeType = 'Wrapper';
      children = [];
      break;
    default: // Portals, coroutines, yields
      nodeType = 'Native';
      props = fiber.memoizedProps;
      name = 'TODO_NOT_IMPLEMENTED_YET';
      children = [];
      break;
  }

  if (Array.isArray(children)) {
    let child = fiber.child;
    while (child) {
      children.push(child._debugID);
      child = child.sibling;
    }
  }

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
  };
}

module.exports = getDataFiber;
