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

import type {Map} from 'immutable';

var React = require('react');
var assign = require('object-assign');

class Query {
  props: {
    data: Map,
    onSelect: () => void,
  };
  render(): ReactElement {
    var data = this.props.data;
    var containerStyle = styles.container;
    if (this.props.isSelected) {
      containerStyle = {
        ...styles.container,
        ...styles.selectedContainer,
      };
    }
    var statusStyle = assign({}, styles.status, {
      backgroundColor: statusColors[data.get('status')] || statusColors.error,
    });

    return (
      <li onClick={this.props.onSelect} style={containerStyle}>
        <div style={statusStyle} />
        <div style={styles.name}>
          {data.get('name')}
        </div>
        <div style={styles.time}>
          {new Date(data.get('start')).toLocaleTimeString()}
        </div>
        <div style={styles.duration}>
          {data.get('end') - data.get('start')}ms
        </div>
      </li>
    );
  }
}

var statusColors = {
  pending: 'orange',
  success: 'green',
  failure: 'red',
  error: '#aaa',
};

var styles = {
  container: {
    padding: '10px 20px',
    cursor: 'pointer',
    display: 'flex',
    fontSize: 14,
  },

  selectedContainer: {
    backgroundColor: '#eef',
  },

  name: {
    flex: 1,
    fontSize: 16,
    padding: 10,
  },

  time: {
    padding: 10,
  },

  duration: {
    padding: 10,
  },

  status: {
    width: 20,
    height: 20,
    margin: 10,
    borderRadius: 25,
    backgroundColor: '#aaa',
  },

  text: {
    whiteSpace: 'pre',
    fontFamily: 'monospace',
    flex: 1,
  },
};

module.exports = Query;
