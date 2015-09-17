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

var globalHook = require('../../../backend/GlobalHook.js');
var source = ';(' + globalHook.toString() + ')(window);';

var script = document.createElement('script');
script.textContent = source;
document.documentElement.appendChild(script);
script.parentNode.removeChild(script);
