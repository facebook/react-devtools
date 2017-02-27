/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/**
 * Retrieves the value from the path of nested objects
 * @param  {Object} base Base or root object for path
 * @param  {Array<String>} path nested path
 * @return {any}      Value at end of path or `mull`
 */
function getIn(base, path) {
  return path.reduce((obj, attr) => {
    if (obj) {
      if (Object.prototype.hasOwnProperty.call(obj, attr)) {
        return obj[attr];
      }
      if (typeof obj.get === 'function') {
        return obj.get(attr);
      }
      if (typeof obj[Symbol.iterator] === 'function' && Number.isInteger(attr)) {
        var i = 0;
        for (var value of obj) {
          i++;
          if (i == attr) {
            return value;
          }
        }
      }
    }

    return null;
  }, base);
}

module.exports = getIn;
