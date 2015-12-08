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
 */
'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var {PropTypes} = React;

class BananaSlugControl extends React.Component {
  constructor(props) {
    super(props);
    this._toogle = this._toogle.bind(this);
  }

  render() {
    return (
      <div style={styles.container} onClick={this._toogle} tabIndex={0}>
        <input
          style={styles.checkbox}
          type="checkbox"
          checked={this.props.enabled}
          readOnly={true}
        />
        <span>bananaslug</span>
      </div>
    );
  }

  _toogle() {
    this.props.onToggle(!this.props.enabled);
  }
}

var styles = {
  checkbox: {
    pointerEvents: 'none',
  },
  container: {
    WebkitUserSelect: 'none',
    cursor: 'pointer',
    display: 'inline-block',
    fontFamily: 'arial',
    fontSize: '12px',
    outline: 'none',
    userSelect: 'none',
  },
};

module.exports = BananaSlugControl;
