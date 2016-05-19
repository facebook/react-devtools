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

class Query extends React.Component {
  props: {
    data: Map,
    oddRow: boolean,
    onSelect: () => void,
  };
  render() {
    var data = this.props.data;
    var containerStyle = styles.container;
    if (this.props.isSelected) {
      containerStyle = styles.containerSelected;
    } else if (this.props.oddRow) {
      containerStyle = styles.containeroOddRow;
    }

    var status = data.get('status');
    var statusStyle = {
      ...styles.status,
      backgroundColor: statusColors[status] || statusColors.error,
    };

    const start = data.get('start');
    const end = data.get('end');

    return (
      <tr onClick={this.props.onSelect} style={containerStyle}>
        <td style={styles.tdFirst}>
          <span style={statusStyle} title={status} />
        </td>
        <td style={styles.tdName}>
          {data.get('name')}
        </td>
        <td style={styles.td}>
          {Math.round(start) / 1000}s
        </td>
        <td style={styles.td}>
          {Math.round(end - start)}ms
        </td>
      </tr>
    );
  }
}

var statusColors = {
  pending: 'orange',
  success: 'green',
  failure: 'red',
  error: '#aaa',
};

var baseContainer = {
  cursor: 'pointer',
  fontSize: 11,
  height: 21,
  lineHeight: '21px',
  fontFamily: "'Lucida Grande', sans-serif",
};

var baseTD = {
  whiteSpace: 'nowrap',
  'padding': '1px 4px',
  'lineHeight': '17px',
  'borderLeft': '1px solid #e1e1e1',
};

var styles = {
  container: baseContainer,

  containerSelected: {
    ...baseContainer,
    backgroundColor: '#3879d9',
    color: 'white',
  },

  containeroOddRow: {
    ...baseContainer,
    backgroundColor: '#f5f5f5',
  },

  td: baseTD,

  tdFirst: {
    ...baseTD,
    borderLeft: '',
  },

  tdName: {
    ...baseTD,
    width: '100%',
  },

  status: {
    display: 'inline-block',
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#aaa',
  },
};

module.exports = Query;
