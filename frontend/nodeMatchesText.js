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

var SearchUtils = require('./SearchUtils');

import type {Map} from 'immutable';
import type Store from './Store';

function nodeMatchesText(node: Map, needle: string, key: string, store: Store): boolean {
  var name = node.get('name');
  var wrapper = store.get(store.getParent(key));
  if (node.get('nodeType') === 'Native' && wrapper && wrapper.get('nodeType') === 'NativeWrapper') {
    return false;
  }
  var useRegex = SearchUtils.shouldSearchUseRegex(needle);
  if (name) {
    if (node.get('nodeType') !== 'Wrapper') {
      return validString(name, needle, useRegex);
    }
  }
  var text = node.get('text');
  if (text) {
    return validString(text, needle, useRegex);
  }
  var children = node.get('children');
  if (typeof children === 'string') {
    return validString(children, needle, useRegex);
  }
  return false;
}

function validString(str: string, needle: string, regex: boolean): boolean {
  if (regex) {
    try {
      var regExp = SearchUtils.searchTextToRegExp(needle);
      return regExp.test(str.toLowerCase());
    } catch (error) {
      return false;
    }
  }
  return str.toLowerCase().indexOf(needle) !== -1;
}

module.exports = nodeMatchesText;
