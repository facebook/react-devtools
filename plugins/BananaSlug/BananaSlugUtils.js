/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const window = global;

function getWebDOMWIndow(): ?Object {
  return canUseWebDOM() ? window : null;
}

function canUseWebDOM(): boolean {
  if (window === undefined) {
    return false;
  }

  if (!window.document || !window.document.createElement) {
    return false;
  }

  return true;
}

var BananaSlugUtils = {
  canUseWebDOM,
  getWebDOMWIndow,
};

module.exports = BananaSlugUtils;
