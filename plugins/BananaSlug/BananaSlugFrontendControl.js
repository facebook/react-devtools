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

import type {
  ControlState,
} from './BananaSlugTypes';

type Props = {
  onChange: (v: ControlState) => void,
};

type State = {};

type DefaultProps = {};

const StateRecord = immutable.Record({
  enabled: false,
});

class BananaSlugFrontendControl extends
  React.Component<DefaultProps, Props, State> {
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

  render(): ReactElement {
    var state = this.props.state || this._defaultState;
    return (
      <div style={styles.container} onClick={this._toggle} tabIndex={0}>
        <input
          style={styles.checkbox}
          type="checkbox"
          checked={state.enabled}
          readOnly={true}
        />
        <span>trace react updates</span>
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

module.exports = BananaSlugFrontendControl;
