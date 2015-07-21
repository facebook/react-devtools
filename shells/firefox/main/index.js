/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

var self = require('sdk/self');

// this installs the global hook
require('./pageMod');

// this registers the devtools panel
require('./Tool');

const { trackSelection } = require('./trackSelection');

function main(options, callbacks) {
  trackSelection();
}

function onUnload(reason) {
}

// Exports from this module
exports.main = main;
exports.onUnload = onUnload;
