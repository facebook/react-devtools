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
var ReactDOM = require('react-dom');
var SettingsPane = require('./SettingsPane');
var TreeView = require('./TreeView');
var {PropTypes} = React;

type EventLike = {
  keyCode: number,
  target: Node,
  preventDefault: () => void,
  stopPropagation: () => void,
};

type State = {
  focused: boolean,
};

class SearchPane extends React.Component {
  input: ?HTMLElement;
  _key: (evt: EventLike) => void;
  state: State;

  render() {
    return (
      <div style={styles.container}>
        <SettingsPane />
        <TreeView reload={this.props.reload} />
      </div>
    );
  }
}

SearchPane.propTypes = {
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

module.exports = SearchPane;
