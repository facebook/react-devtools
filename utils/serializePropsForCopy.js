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

const consts = require('../agent/consts');

function stripFunctions(props: Object) {
  for (const key in props) {
    const value = props[key];
    const type = (value && value[consts.type]) || typeof value;

    if (type === 'function') {
      const name = value[consts.name];

      props[key] = `[function ${name}]`;
    }
  }
}

function serializePropsForCopy(props: Object): string {
  const cloned = Object.assign({}, props);

  // Don't try to copy 'children'; the data is probably not meaningful.
  delete cloned.children;

  // Convert functions to '[function]'
  stripFunctions(cloned);

  try {
    return JSON.stringify(cloned, null, 2);
  } catch (error) {
    return '';
  }
}

module.exports = serializePropsForCopy;
