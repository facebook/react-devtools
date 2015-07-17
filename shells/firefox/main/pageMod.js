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

// inject the global hook
var pageMod = require("sdk/page-mod");

pageMod.PageMod({
  include: ["*", "file://*"],
  contentScriptFile: './build/GlobalHook.js',
  contentScriptWhen: 'start',
});

