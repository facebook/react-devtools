/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * $FLowFixMe
 * - thinks all react component classes must inherit from React.Component
 */
'use strict';

var React = require('react');
var SettingsPane = require('./SettingsPane');
var TreeView = require('./TreeView');
var PinnedComponents = require('./PinnedComponents');
var {PropTypes} = React;

type State = {
  focused: boolean,
};

class LeftPane extends React.Component {
  input: ?HTMLElement;
  state: State;

  render() {
    return (
      <div style={styles.container}>
        <SettingsPane />
        <PinnedComponents />
        <TreeView reload={this.props.reload} />
      </div>
    );
  }
}

LeftPane.propTypes = {
  reload: PropTypes.func,
};

var styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
};

module.exports = LeftPane;
