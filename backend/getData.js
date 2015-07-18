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

import type {DataType, OpaqueReactElement, NativeType} from './types';

function getData(element: OpaqueReactElement): DataType {
  var children = null;
  var props = null;
  var state = null;
  var context = null;
  var updater = null;
  var name = null;
  var type = null;
  var text = null;
  var publicInstance = null;
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
        // this is a top-level wrapper
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
      // setNativeProps: inst.setNativeProps && inst.setNativeProps.bind(inst),
      setInProps: inst.forceUpdate && setInProps.bind(null, inst),
      setInState: inst.forceUpdate && setInState.bind(null, inst),
      setInContext: inst.forceUpdate && setInContext.bind(null, inst),
    }
    publicInstance = inst;
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
    publicInstance,
  };
}

function setInProps(inst, path: Array<string | number>, value: any) {
  inst.props = copyWithSet(inst.props, path, value);
  // setIn(inst.props, path, value);
  inst.forceUpdate();
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
  var parent = path.reduce((obj, attr) => obj ? obj[attr] : null, obj);
  if (parent) {
    parent[last] = value;
  }
}

function copyWithSet(obj: Object | Array<any>, path: Array<string | number>, value: any) {
  var newObj = {};
  var curObj = newObj;
  var last = path.pop();
  var cancelled = path.some(attr => {
    // $FlowFixMe
    if (!obj[attr]) {
      return true;
    }
    var next = {};
    if (Array.isArray(obj)) {
      for (var i=0; i<obj.length; i++) {
        if (i === attr) {
          if (Array.isArray(obj[i])) {
            next = [];
          }
          curObj[i] = next;
        } else {
          curObj[i] = obj[i];
        }
      }
    } else {
      for (var name in obj) {
        if (name === attr) {
          if (Array.isArray(obj[attr])) {
            next = [];
          }
          // $FlowFixMe number or string is fine here
          curObj[name] = next;
        } else {
          // $FlowFixMe number or string is fine here
          curObj[name] = obj[name];
        }
      }
    }
    curObj = next;
    // $FlowFixMe number or string is fine here
    obj = obj[attr];
  });
  if (!cancelled) {
    if (Array.isArray(obj)) {
    } else {
      for (var name in obj) {
        curObj[name] = obj[name];
      }
      curObj[last] = value;
    }
  }
  return newObj;
}

function childrenList(children) {
  var res = [];
  for (var name in children) {
    res.push(children[name]);
  }
  return res;
}

module.exports = getData;
