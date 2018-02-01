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

const TraceUpdatesAbstractNodeMeasurer = require('./TraceUpdatesAbstractNodeMeasurer');

import type {
  Measurement,
} from './TraceUpdatesTypes';

const DUMMY = {
  bottom: 0,
  expiration: 0,
  height: 0,
  id: '',
  left: 0,
  right: 0,
  scrollX: 0,
  scrollY: 0,
  top: 0,
  width: 0,
};

class TraceUpdatesWebNodeMeasurer extends TraceUpdatesAbstractNodeMeasurer {
  measureImpl(node: any): Measurement {
    if (!node || typeof node.getBoundingClientRect !== 'function') {
      return DUMMY;
    }

    var rect = node.getBoundingClientRect();
    var scrollX = Math.max(
      document.body ? document.body.scrollLeft : 0,
      document.documentElement ? document.documentElement.scrollLeft : 0,
      window.pageXOffset || 0,
      window.scrollX || 0,
    );

    var scrollY = Math.max(
      document.body ? document.body.scrollTop : 0,
      document.documentElement ? document.documentElement.scrollTop : 0,
      window.pageYOffset || 0,
      window.scrollY || 0,
    );

    return {
      bottom: rect.bottom,
      expiration: 0,
      height: rect.height,
      id: '',
      left: rect.left,
      right: rect.right,
      scrollX,
      scrollY,
      top: rect.top,
      width: rect.width,
    };
  }
}

module.exports = TraceUpdatesWebNodeMeasurer;
