/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

const ReactDOM = require('react-dom');
const React = require('react');

const immutable = require('immutable');

const  {PropTypes} = React;

const Value = immutable.Record({
  enabled: false,
});

class BananaSlugControl extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: new Value(),
    };

    this._toogle = this._toogle.bind(this);
  }

  componentDidMount(): void {
    this.props.onChange(this.state.value);
  }

  componentWillReceiveProps(nextProps: Object): void {
    this.setState({
      value: nextProps.value ?
        this.state.value.merge(nextProps.value) :
        new Value(),
    });
  }

  render() {
    return (
      <div style={styles.container} onClick={this._toogle} tabIndex={0}>
        <input
          style={styles.checkbox}
          type="checkbox"
          checked={this.state.value.enabled}
          readOnly={true}
        />
        <span>bananaslug</span>
      </div>
    );
  }

  _toogle() {
    var value = this.state.value;

    var nextValue = value.merge({
      enabled: !value.enabled,
    });

    this.props.onChange(nextValue);
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
