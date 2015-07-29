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

function sanitize(data: Object, cleaned: Array<Array<string>>, path?: Array<string>, level?: number): string | Object {
  level = level || 0;
  path = path || [];
  if (typeof data === 'function') {
    cleaned.push(path);
    return {
      name: data.name,
      type: 'function',
    };
  }
  if (!data || typeof data !== 'object') {
    if (typeof data === 'string' && data.length > 500) {
      return data.slice(0, 500) + '...';
    }
    return data;
  }
  if (data._reactFragment) {
    // React Fragments error if you try to inspect them.
    return 'A react fragment';
  }
  if (level > 2) {
    cleaned.push(path);
    return {
      type: Array.isArray(data) ? 'array' : 'object',
      name: data.constructor.name === 'Object' ? '' : data.constructor.name,
      meta: {
        length: data.length,
      },
    };
  }
  if (Array.isArray(data)) {
    // $FlowFixMe path is not undefined.
    return data.map((item, i) => sanitize(item, cleaned, path.concat([i]), level + 1));
  }
  // TODO when this is in the iframe window, we can just use Object
  if (data.constructor && typeof data.constructor === 'function' && data.constructor.name !== 'Object') {
    cleaned.push(path);
    return {
      name: data.constructor.name,
      type: 'object',
    };
  }
  var res = {};
  for (var name in data) {
    res[name] = sanitize(data[name], cleaned, path.concat([name]), level + 1);
  }
  return res;
}

module.exports = sanitize;
