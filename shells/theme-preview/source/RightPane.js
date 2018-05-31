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

const Immutable = require('immutable');
const PropTypes = require('prop-types');
const React = require('react');

const PropState = require('../../../frontend/PropState');

type Props = {};

class RightPane extends React.Component<Props> {
  getChildContext() {
    return {
      onChange: noop,
    };
  }

  render() {
    return (
      <PropState
        extraPanes={[]}
        node={fauxNode}
        onViewElementSource={noop}
      />
    );
  }
}

RightPane.childContextTypes = {
  onChange: PropTypes.func,
};

const fauxNode = Immutable.Map({
  canUpdate: false,
  children: ['grandparent'],
  name: 'div',
  nodeType: 'Composite',
  props: {
    boolean: true,
    integer: 123,
    string: 'foobar',
  },
  source: {
    fileName: 'grandparent.js',
    lineNumber: '10',
  },
  state: {},
});

const noop = () => {};

module.exports = RightPane;
