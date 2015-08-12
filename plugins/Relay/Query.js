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

var React = require('react');
var assign = require('object-assign');

class Query {
  props: {
    data: Map,
  };
  render(): ReactElement {
    var data = this.props.data;
    var statusStyle = assign({}, styles.status, {
      backgroundColor: statusColors[data.get('status')] || statusColors.error
    });
    return (
      <li style={styles.container}>
        <div style={statusStyle} />
        <div style={styles.name}>
          {data.get('name')}
        </div>
        <div style={styles.text}>
          {JSON.stringify(data.get('variables'), null, 2)}
        </div>
        <div>
          {data.get('text')}
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
    display: 'flex',
  },

  name: {
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
