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
var copyWithSet = require('./copyWithSet');
var getDisplayName = require('./getDisplayName');

/**
 * Convert a react internal instance to a sanitized data object.
 */
function getData(internalInstance: Object): DataType {
  var children = null;
  var props = null;
  var state = null;
  var context = null;
  var updater = null;
  var name = null;
  var type = null;
  var key = null;
  var ref = null;
  var source = null;
  var text = null;
  var publicInstance = null;
  var nodeType = 'Native';
  // If the parent is a native node without rendered children, but with
  // multiple string children, then the `element` that gets passed in here is
  // a plain value -- a string or number.
  if (typeof internalInstance !== 'object') {
    nodeType = 'Text';
    text = internalInstance + '';
  } else if (internalInstance._currentElement === null || internalInstance._currentElement === false) {
    nodeType = 'Empty';
  } else if (internalInstance._renderedComponent) {
    nodeType = 'NativeWrapper';
    children = [internalInstance._renderedComponent];
    props = internalInstance._instance.props;
    state = internalInstance._instance.state;
    context = internalInstance._instance.context;
    if (context && Object.keys(context).length === 0) {
      context = null;
    }
  } else if (internalInstance._renderedChildren) {
    children = childrenList(internalInstance._renderedChildren);
  } else if (internalInstance._currentElement && internalInstance._currentElement.props) {
    // This is a native node without rendered children -- meaning the children
    // prop is the unfiltered list of children.
    // This may include 'null' or even other invalid values, so we need to
    // filter it the same way that ReactDOM does.
    // We do a simplified filtering for valid children, instead of using
    // `React.Children` so that we don't pull in the whole React library.
    const REACT_ELEMENT_TYPE =
      (
        typeof Symbol === 'function'
        && Symbol.for
        && Symbol.for('react.element')
      )
      || 0xeac7;
    let unfilteredChildren = internalInstance._currentElement.props.children;
    const childrenType = typeof unfilteredChildren;
    if (unfilteredChildren === null || childrenType === 'undefined') {
      // only one child and it's invalid
      unfilteredChildren = [];
    } else if (childrenType === 'boolean'
       || childrenType === 'string'
       || childrenType === 'number'
       || (childrenType === 'object' && unfilteredChildren.$$typeof === REACT_ELEMENT_TYPE)) {
      // only one child, so let's wrap it in an array
      unfilteredChildren = [unfilteredChildren];
    }
    var filteredChildren = [];
    function gatherValidChildren(childrenArray) {
      childrenArray.forEach((child, i) => {
        if (typeof child === 'string' || typeof child === 'number') {
          filteredChildren.push(child);
        } else if (Array.isArray(child)) {
          gatherValidChildren(child);
        }
        // ignore 'null' or invalid children
      });
    }
    gatherValidChildren(unfilteredChildren);
    if (filteredChildren.length <= 1) {
      // children must be an array of nodes or a string or undefined
      // can't be an empty array
      children = filteredChildren.length
        ? String(filteredChildren[0])
        : undefined;
    } else {
      children = filteredChildren;
    }
  }

  if (!props && internalInstance._currentElement && internalInstance._currentElement.props) {
    props = internalInstance._currentElement.props;
  }

  // != used deliberately here to catch undefined and null
  if (internalInstance._currentElement != null) {
    type = internalInstance._currentElement.type;
    if (internalInstance._currentElement.key) {
      key = String(internalInstance._currentElement.key);
    }
    source = internalInstance._currentElement._source;
    ref = internalInstance._currentElement.ref;
    if (typeof type === 'string') {
      name = type;
      if (internalInstance._nativeNode != null) {
        publicInstance = internalInstance._nativeNode;
      }
      if (internalInstance._hostNode != null) {
        publicInstance = internalInstance._hostNode;
      }
    } else if (typeof type === 'function') {
      nodeType = 'Composite';
      name = getDisplayName(type);
      // 0.14 top-level wrapper
      // TODO(jared): The backend should just act as if these don't exist.
      if (internalInstance._renderedComponent && (
        internalInstance._currentElement.props === internalInstance._renderedComponent._currentElement ||
        internalInstance._currentElement.type.isReactTopLevelWrapper
      )) {
        nodeType = 'Wrapper';
      }
      if (name === null) {
        name = 'No display name';
      }
    } else if (typeof internalInstance._stringText === 'string') {
      nodeType = 'Text';
      text = internalInstance._stringText;
    } else {
      name = getDisplayName(type);
    }
  }

  if (internalInstance._instance) {
    var inst = internalInstance._instance;
    updater = {
      setState: inst.setState && inst.setState.bind(inst),
      forceUpdate: inst.forceUpdate && inst.forceUpdate.bind(inst),
      setInProps: inst.forceUpdate && setInProps.bind(null, internalInstance),
      setInState: inst.forceUpdate && setInState.bind(null, inst),
      setInContext: inst.forceUpdate && setInContext.bind(null, inst),
    };
    if (typeof type === 'function') {
      publicInstance = inst;
    }

    // TODO: React ART currently falls in this bucket, but this doesn't
    // actually make sense and we should clean this up after stabilizing our
    // API for backends
    if (inst._renderedChildren) {
      children = childrenList(inst._renderedChildren);
    }
  }

  if (typeof internalInstance.setNativeProps === 'function') {
    // For editing styles in RN
    updater = {
      setNativeProps(nativeProps) {
        internalInstance.setNativeProps(nativeProps);
      },
    };
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

function setInProps(internalInst, path: Array<string | number>, value: any) {
  var element = internalInst._currentElement;
  internalInst._currentElement = {
    ...element,
    props: copyWithSet(element.props, path, value),
  };
  internalInst._instance.forceUpdate();
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

function childrenList(children) {
  var res = [];
  for (var name in children) {
    res.push(children[name]);
  }
  return res;
}

module.exports = getData;
