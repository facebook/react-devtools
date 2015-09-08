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
var decorate = require('../../frontend/decorate');
var DataView = require('../../frontend/DataView/DataView');

class QueryViewer {
  props: {
    data: Map,
    inspect: (path: Array<string>, cb: () => void) => void,
  };
  render(): ReactElement {
    var data = this.props.data;
    var info = {
    };
    var type = data.get('type');
    if (type === 'mutation') {
      info.mutation = data.get('mutation');
    } else {
      info.query = data.get('query');
    }
    info.variables = data.get('variables');
    var status = data.get('status');
    if (status === 'success') {
      info.response = data.get('response');
    } else if (status === 'failure') {
      info.error = data.get('error');
    }
    return (
      <div style={styles.container}>
        <div style={styles.title}>{data.get('name')}</div>
        <div style={styles.time}>
          {new Date(data.get('start')).toLocaleTimeString()}
        </div>
        <div style={styles.duration}>
          {data.get('end') - data.get('start')}ms
        </div>
        <DataView
          data={info}
          noSort={true}
          readOnly={true}
          showMenu={false}
          inspect={this.props.inspect}
          path={[]}
        />
      </div>
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
    flexDirection: 'column',
    overflow: 'auto',
    minHeight: 0,
    flex: 1,
  },

  title: {
    fontSize: 20,
    color: '#666',
    marginBottom: 15,
  },

  name: {
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

  variables: {
    whiteSpace: 'pre',
    fontFamily: 'monospace',
    wordWrap: 'break-word',
  },

  text: {
    whiteSpace: 'pre',
    fontFamily: 'monospace',
    wordWrap: 'break-word',
  },
};

module.exports = decorate({
  store: 'relayStore',
  listeners: (props, store) => ['selectedQuery', store.selectedQuery],
  props(store) {
    return {
      data: store.queries.get(store.selectedQuery),
      inspect: store.inspect.bind(store, store.selectedQuery),
    };
  },
}, QueryViewer);
