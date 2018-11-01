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

var decorate = require('../../frontend/decorate');
var SettingsRadio = require('../../frontend/SettingsRadio');

var Wrapped = decorate({
  listeners() {
    return ['hidingStyleChange'];
  },
  props(store) {
    return {
      state: store.hidingStyle,
      onChange: state => store.changeHidingStyle(state),
    };
  },
}, SettingsRadio);

module.exports = Wrapped;
