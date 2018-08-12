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
const immutable = require('immutable');

const {sansSerif} = require('./Themes/Fonts');

import type {ControlState} from './types.js';

type Props = {
  state: any,
  text: string,
  onChange: (v: ControlState) => void,
};

type State = StateRecord;

type DefaultProps = {};

const StateRecord = immutable.Record({
  enabled: false,
});

class SettingsCheckbox extends React.Component<Props, State> {
  defaultProps: DefaultProps;

  _defaultState: ControlState;
  _toggle: (b: boolean) => void;

  constructor(props: Props) {
    super(props);
    this._toggle = this._toggle.bind(this);
    this._defaultState = new StateRecord();
  }

  componentDidMount(): void {
    if (!this.props.state !== this._defaultState) {
      this.props.onChange(this._defaultState);
    }
  }

  render() {
    var state = this.props.state || this._defaultState;
    return (
      <div style={styles.container} onClick={this._toggle} tabIndex={0}>
        <input
          style={styles.checkbox}
          type="checkbox"
          checked={state.enabled}
          readOnly={true}
        />
        <span>{this.props.text}</span>
      </div>
    );
  }

  _toggle() {
    var state = this.props.state || this._defaultState;
    var nextState = state.merge({
      enabled: !state.enabled,
    });

    this.props.onChange(nextState);
  }
}

var styles = {
  checkbox: {
    pointerEvents: 'none',
    marginRight: '5px',
  },
  container: {
    WebkitUserSelect: 'none',
    cursor: 'default',
    display: 'inline-block',
    outline: 'none',
    fontFamily: sansSerif.family,
    userSelect: 'none',
    marginRight: '10px',
  },
};

module.exports = SettingsCheckbox;
