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

function sanitize(data: Object, path: Array<string>, cleaned: Array<Array<string>>, level?: number): string | Object {
  level = level || 0;
  if ('function' === typeof data) {
    cleaned.push(path);
    return {
      name: data.name,
      type: 'function',
    };
  }
  if (!data || 'object' !== typeof data) {
    if ('string' === typeof data && data.length > 500) {
      return data.slice(0, 500) + '...';
    }
    return data;
  }
  if (data._reactFragment) {
    return 'A react fragment';
  }
  if (level > 2) {
    cleaned.push(path);
    return {
      type: Array.isArray(data) ? 'array' : 'object',
      name: 'Object' === data.constructor.name ? '' : data.constructor.name,
      meta: {
        length: data.length,
      },
    };
  }
  if (Array.isArray(data)) {
    return data.map((item, i) => sanitize(item, path.concat([i]), cleaned, level + 1));
  }
  // TODO when this is in the iframe window, we can just use Object
  if (data.constructor && 'function' === typeof data.constructor && data.constructor.name !== 'Object') {
    cleaned.push(path);
    return {
      name: data.constructor.name,
      type: 'object',
    };
  }
  var res = {};
  for (var name in data) {
    res[name] = sanitize(data[name], path.concat([name]), cleaned, level + 1);
  }
  return res;
}

module.exports = sanitize;
