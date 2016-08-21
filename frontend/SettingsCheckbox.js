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
const assign = require('object-assign');

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

class SettingsCheckbox extends React.Component {
  props: Props;
  defaultProps: DefaultProps;
  state: State;

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
        {
          this.props.record ? (
            <div
              style={ assign(styles.recordButton,
                state.enabled ? styles.recordingState : styles.defaultState) }>
            </div>
          ) : (
            <input
              style={styles.checkbox}
              type="checkbox"
              checked={state.enabled}
              readOnly={true}
            />
          )
        }
        <span style={styles.checkboxText}>{this.props.text}</span>
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
  },
  recordButton: {
    width: '11px',
    height: '11px',
    borderRadius: '50%',
    display: 'inline-block',
    marginRight: '3px',
    verticalAlign: 'middle',
  },
  defaultState: {
    backgroundColor: '#5a5a5a',
    boxShadow: 'none',
  },
  recordingState: {
    backgroundColor: '#00d8ff',
    boxShadow: '0 0 2px 2px rgba(0, 215, 255, 0.35)',
  },
  container: {
    WebkitUserSelect: 'none',
    cursor: 'default',
    display: 'inline-block',
    fontFamily: 'arial',
    fontSize: '12px',
    lineHeight: 1.5,
    outline: 'none',
    userSelect: 'none',
    margin: '0px 4px',
  },
  checkboxText: {
    marginLeft: '3px',
    color: '#5a5a5a',
  },
};

module.exports = SettingsCheckbox;
