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

var React = require('react');

var consts = require('../../agent/consts');
var valueStyles = require('../value-styles');

function previewComplex(data: Object) {
  if (Array.isArray(data)) {
    return (
      <span style={valueStyles.array}>
        Array[{data.length}]
      </span>
    );
  }

  if (!data[consts.type]) {
    return '{…}';
  }

  var type = data[consts.type];
  if (type === 'function') {
    return (
      <span style={valueStyles.func}>
        {data[consts.name] || 'fn'}()
      </span>
    );
  } else if (type === 'object') {
    return (
      <span style={valueStyles.object}>
        {data[consts.name] + '{…}'}
      </span>
    );
  } else if (type === 'symbol') {
    return (
      <span style={valueStyles.symbol}>
        {data[consts.name]}
      </span>
    );
  } else if (type === 'date') {
    return (
      <span style={valueStyles.date}>
        {data[consts.name]}
      </span>
    );
  }
  return null;
}

module.exports = previewComplex;
