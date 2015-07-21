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

var consts = require('./consts');

function hydrate(data: Object, cleaned: Array<Array<string>>): void {
  cleaned.forEach(path => {
    var last = path.pop();
    var obj = path.reduce((obj_, attr) => obj_ ? obj_[attr] : null, data);
    if (!obj || !obj[last]) {
      return;
    }
    var replace: {[key: Symbol]: boolean | string} = {};
    replace[consts.name] = obj[last].name;
    replace[consts.type] = obj[last].type;
    replace[consts.meta] = obj[last].meta;
    replace[consts.inspected] = false;
    obj[last] = replace;
  });
}

module.exports = hydrate;
