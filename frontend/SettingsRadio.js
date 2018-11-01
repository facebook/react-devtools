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

const React = require('react');

const {sansSerif} = require('./Themes/Fonts');


type StateValue = any;

type Props = {
  state: StateValue,
  value: StateValue,
  text: string,
  onChange: (v: StateValue) => void,
};

class SettingsRadio extends React.Component<Props> {
  _toggle: (b: boolean) => void;

  constructor(props: Props) {
    super(props);
    this._toggle = this._toggle.bind(this);
  }

  render() {
    var {state, value} = this.props;
    return (
      <label style={styles.container} onClick={this._toggle} tabIndex={0}>
        <input
          style={styles.radio}
          type="radio"
          checked={state === value}
          readOnly={true}
        />
        <span>{this.props.text}</span>
      </label>
    );
  }

  _toggle() {
    var {onChange, value} = this.props;
    onChange(value);
  }
}

var styles = {
  radio: {
    pointerEvents: 'none',
    marginRight: '0.5rem',
  },
  container: {
    WebkitUserSelect: 'none',
    cursor: 'default',
    display: 'inline-block',
    outline: 'none',
    fontFamily: sansSerif.family,
    userSelect: 'none',
    marginRight: '0.5rem',
  },
};

module.exports = SettingsRadio;
