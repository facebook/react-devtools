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
var SettingsCheckbox = require('../../frontend/SettingsCheckbox');

var Wrapped = decorate({
  listeners() {
    return ['darkmodechange'];
  },
  props(store) {
    return {
      state: store.darkModeState,
      text: 'Dark Mode',
      onChange: state => store.toggleDarkMode(state),
    };
  },
}, SettingsCheckbox);

module.exports = Wrapped;
