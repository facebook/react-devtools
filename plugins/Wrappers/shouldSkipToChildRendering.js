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

/*
 * Should hide higher-order wrapper components. An HOC is defined
 * as a component that returns a single, non-DOM child.
 */
function shouldSkipToChildRendering(node, store) {
  if (store.hideWrappersState && store.hideWrappersState.enabled) {
    const children = node.get('children');
    if (children && children.length === 1) {
      const childName = store.get(children[0]).get('name');
      return childName && !childName.match(/^[a-z]+$/);
    }
  }
  return false;
}

module.exports = shouldSkipToChildRendering;
