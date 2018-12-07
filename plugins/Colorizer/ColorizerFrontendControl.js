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
    return ['colorizerchange'];
  },
  props(store) {
    return {
      label: 'Highlight Search',
      isChecked: store.colorizer,
      onChange: enabled => store.changeColorizer(enabled),
    };
  },
}, SettingsCheckbox);

module.exports = Wrapped;
