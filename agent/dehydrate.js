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

/**
 * Strip out complex data (instances, functions, and data nested > 2 levels
 * deep). The paths of the stripped out objects are appended to the `cleaned`
 * list. On the other side of the barrier, the cleaned list is used to
 * "re-hydrate" the cleaned representation into an object with symbols as
 * attributes, so that a sanitized object can be distinguished from a normal
 * object.
 *
 * Input: {"some": {"attr": fn()}, "other": AnInstance}
 * Output: {
 *   "some": {
 *     "attr": {"name": the fn.name, type: "function"}
 *   },
 *   "other": {
 *     "name": "AnInstance",
 *     "type": "object",
 *   },
 * }
 * and cleaned = [["some", "attr"], ["other"]]
 */
function dehydrate(data: Object, cleaned: Array<Array<string>>, path?: Array<string>, level?: number): string | Object {
  // Support third-party frameworks data objects in react component state.
  }

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
    // We have to do this assignment b/c Flow doesn't think "symbol" is
    // something typeof would return. Error 'unexpected predicate "symbol"'
    var type = typeof data;
    if (type === 'symbol') {
      cleaned.push(path);
      return {
        type: 'symbol',
        name: data.toString(),
      };
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
      name: !data.constructor || data.constructor.name === 'Object' ? '' : data.constructor.name,
      meta: Array.isArray(data) ? {
        length: data.length,
      } : null,
    };
  }
  if (Array.isArray(data)) {
    // $FlowFixMe path is not undefined.
    return data.map((item, i) => dehydrate(item, cleaned, path.concat([i]), level + 1));
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
    res[name] = dehydrate(data[name], cleaned, path.concat([name]), level + 1);
  }
  return res;
}

module.exports = dehydrate;
