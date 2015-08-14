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
var decorate = require('../../frontend/decorate');

class ElementPanel {
  render() {
    return (
      <div>
        <ul style={styles.dataIDs}>
        {this.props.dataIDs.map(({id, queries}) => (
          <li>
            ID: {id} <br/>
            <ul style={styles.queries}>
              {queries.map(query => (
                <li>
                  Query: {query.get('name')}
                </li>
              ))}
            </ul>
          </li>
        ))}
        </ul>
      </div>
    );
  }
}

var styles = {
  dataIDs: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  queries: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
};

module.exports = decorate({
  store: 'relayStore',
  listeners(props, store) {
    return [props.id];
  },
  shouldUpdate(props, prevProps) {
    return props.id !== prevProps.id;
  },
  props(store, props) {
    var dataIDs = [];
    if (store.nodesToDataIDs[props.id]) {
      for (var id of store.nodesToDataIDs[props.id]) {
        dataIDs.push({
          id,
          queries: (store.queriesByDataID[id] || []).map(qid => store.queries.get(qid)),
        });
      }
    }
    return {
      dataIDs,
      jumpTo: dataID => store.jumpToDataID(dataID),
    };
  },
}, ElementPanel);
