/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const BananaSlugAbstractNodeMeasurer = require('./BananaSlugAbstractNodeMeasurer');

class BananaSlugWebNodeMeasurer extends BananaSlugAbstractNodeMeasurer {
  constructor() {
    super();
  }

  __measureImpl(node): ?Object {
    if (!node || typeof node.getBoundingClientRect !== 'function') {
      return {
        bottom: 0,
        height: 0,
        left: 0,
        top: 0,
        width: 0,
      };
    }

    var rect = node.getBoundingClientRect();
    return {
      bottom: rect.bottom,
      height: rect.height,
      left: rect.left,
      top: rect.top,
      width: rect.width,
    };
  }
}

module.exports = BananaSlugWebNodeMeasurer;