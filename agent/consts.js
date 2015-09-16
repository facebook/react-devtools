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

var Symbol = require('es6-symbol');

module.exports = {
  name: Symbol('name'),
  type: Symbol('type'),
  inspected: Symbol('inspected'),
  meta: Symbol('meta'),
  proto: Symbol('proto'),
};
