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

import type {Map} from 'immutable';

function nodeMatchesText(node: Map, needle: string): boolean {
  var name = node.get('name');
  if (name) {
    if (node.get('nodeType') !== 'Wrapper' && name.toLowerCase().indexOf(needle) !== -1) {
      return true;
    }
  }
  var text = node.get('text');
  if (text && text.toLowerCase().indexOf(needle) !== -1) {
    return true;
  }
  var children = node.get('children');
  if (typeof children === 'string' && children.toLowerCase().indexOf(needle) !== -1) {
    return true;
  }
  return false;
}

module.exports = nodeMatchesText;
