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

function copyWithSetImpl(obj, path, idx, value) {
  if (idx >= path.length) {
    return value;
  }
  var key = path[idx];
  var updated = Array.isArray(obj) ? obj.slice() : assignWithDescriptors(obj);
  // $FlowFixMe number or string is fine here
  updated[key] = copyWithSetImpl(obj[key], path, idx + 1, value);
  return updated;
}

function copyWithSet(obj: Object | Array<any>, path: Array<string | number>, value: any): Object | Array<any> {
  return copyWithSetImpl(obj, path, 0, value);
}

function assignWithDescriptors(source) {
  /* eslint-disable no-proto */
  var target = Object.create(source.__proto__);
  /* eslint-enable no-proto */

  Object.defineProperties(target, Object.keys(source).reduce((descriptors, key) => {
    var descriptor = Object.getOwnPropertyDescriptor(source, key);
    if (descriptor.hasOwnProperty('writable')) {
      descriptor.writable = true;
    }
    descriptors[key] = descriptor;
    return descriptors;
  }, {}));
  return target;
}

module.exports = copyWithSet;
