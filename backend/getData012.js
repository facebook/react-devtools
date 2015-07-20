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

function getData012(element: Object): DataType {
  var children = null;
  var props = element.props;
  var state = element.state;
  var context = element.context;
  var updater = null;
  var name = null;
  var type = null;
  var text = null;
  var publicInstance = null;
  var nodeType = 'Native';
  if (element._renderedComponent) {
    nodeType = 'Wrapper';
    children = [element._renderedComponent];
    if (context && Object.keys(context).length === 0) {
      context = null;
    }
  } else if (element._renderedChildren) {
    name = element.constructor.displayName;
    children = childrenList(element._renderedChildren);
  } else if ('string' === typeof props.children) {
    // string children
    name = element.constructor.displayName;
    children = props.children;
    nodeType = 'Native'
  }

  if (!props && element._currentElement && element._currentElement.props) {
    props = element._currentElement.props;
  }

  if (element._currentElement) {
    type = element._currentElement.type;
    if ('string' === typeof type) {
      name = type;
    } else {
      nodeType = 'Composite';
      name = type.displayName;
      if (!name) {
        name = 'No display name';
      }
    }
  }

  if (!name) {// && element.constructor.displayName) {
    name = element.constructor.displayName || 'No display name';
    nodeType = 'Composite';
  }

  if ('string' === typeof props) {
    nodeType = 'Text';
    text = props;
    props = null;
    name = null;
  }

  if (element.forceUpdate) {
    updater = {
      setState: element.setState.bind(element),
      forceUpdate: element.forceUpdate.bind(element),
      setInProps: element.forceUpdate && setInProps.bind(null, element),
      setInState: element.forceUpdate && setInState.bind(null, element),
      setInContext: element.forceUpdate && setInContext.bind(null, element),
    }
    publicInstance = element;
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

module.exports = getData012;
