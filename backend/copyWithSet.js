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

function copyWithSet(obj: Object | Array<any>, path: Array<string | number>, value: any): Object | Array<any> {
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
      for (var i=0; i<obj.length; i++) {
        curObj[i] = obj[i];
      }
      curObj[last] = value;
    } else {
      for (var name in obj) {
        curObj[name] = obj[name];
      }
      curObj[last] = value;
    }
  }
  return newObj;
}

module.exports = copyWithSet;
