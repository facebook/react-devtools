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

module.exports = function spy() {
  var fn = function() {
    fn.callCount += 1;
    fn.calledOnce = fn.callCount === 1;
    fn.called = true;
    fn.calls.push([].slice.call(arguments));
  };
  fn.calls = [];
  fn.callCount = 0;
  return fn;
};
