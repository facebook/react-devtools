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
 * Get a enhanced/artificial type string based on the object instance
 */
function getPropType(data: Object): string | null {
  if (!data) {
    return null;
  }
  var type = typeof data;

  if (type === 'object') {
    if (data._reactFragment) {
      return 'react_fragment';
    }
    if (Array.isArray(data)) {
      return 'array';
    }
    if (ArrayBuffer.isView(data)) {
      if (data instanceof DataView) {
        return 'data_view';
      }
      return 'typed_array';
    }
    if (data instanceof ArrayBuffer) {
      return 'array_buffer';
    }
    if (typeof data[Symbol.iterator] === 'function') {
      return 'iterator';
    }
    if (Object.prototype.toString.call(data) === '[object Date]') {
      return 'date';
    }
  }

  return type;
}

/**
 * Generate the dehydrated metadata for complex object instances
 */
function createDehydrated(type: string, data: Object, cleaned: Array<Array<string>>, path: Array<string>): Object {
  var meta = {};

  if (type === 'array' || type === 'typed_array') {
    meta.length = data.length;
  }
  if (type === 'iterator' || type === 'typed_array') {
    meta.readOnly = true;
  }

  cleaned.push(path);

  return {
    type,
    meta,
    name: !data.constructor || data.constructor.name === 'Object' ? '' : data.constructor.name,
  };
}

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
function dehydrate(data: Object, cleaned: Array<Array<string>>, path?: Array<string> = [], level?: number = 0): string | Object {

  var type = getPropType(data);

  switch (type) {

    case 'function':
      cleaned.push(path);
      return {
        name: data.name,
        type: 'function',
      };

    case 'string':
      return data.length <= 500 ? data : data.slice(0, 500) + '...';

    // We have to do this assignment b/c Flow doesn't think "symbol" is
    // something typeof would return. Error 'unexpected predicate "symbol"'
    case 'symbol':
      cleaned.push(path);
      return {
        type: 'symbol',
        name: data.toString(),
      };

    // React Fragments error if you try to inspect them.
    case 'react_fragment':
      return 'A React Fragment';

    // ArrayBuffers error if you try to inspect them.
    case 'array_buffer':
    case 'data_view':
      cleaned.push(path);
      return {
        type,
        name: type === 'data_view' ? 'DataView' : 'ArrayBuffer',
        meta: {
          length: data.byteLength,
          uninspectable: true,
        },
      };

    case 'array':
      if (level > 2) {
        return createDehydrated(type, data, cleaned, path);
      }
      return data.map((item, i) => dehydrate(item, cleaned, path.concat([i]), level + 1));

    case 'typed_array':
    case 'iterator':
      return createDehydrated(type, data, cleaned, path);
    case 'date':
      cleaned.push(path);
      return {
        name: data.toString(),
        type: 'date',
        meta: {
          uninspectable: true,
        },
      };
    case 'object':
      if (level > 2 || (data.constructor && typeof data.constructor === 'function' && data.constructor.name !== 'Object')) {
        return createDehydrated(type, data, cleaned, path);
      } else {

        var res = {};
        for (var name in data) {
          res[name] = dehydrate(data[name], cleaned, path.concat([name]), level + 1);
        }
        return res;
      }

    default:
      return data;
  }
}

module.exports = dehydrate;
