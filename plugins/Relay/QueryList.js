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

import type {OrderedMap} from 'immutable';

var React = require('react');
var decorate = require('../../frontend/decorate');
var Query = require('./Query');

class QueryList {
  props: {
    queries: OrderedMap,
    selectQuery: (id: string) => void,
    selectedQuery: ?string,
  };

  render() {
    if (!this.props.queries.count()) {
      return <div style={styles.empty}>No Relay Queries logged</div>;
    }
    var rows = this.props.queries.valueSeq().map((q, i) => (
      <Query
        data={q}
        isSelected={q.get('id') === this.props.selectedQuery}
        key={q.get('id')}
        oddRow={(i % 2) === 1}
        onSelect={() => this.props.selectQuery(q.get('id'))}
      />
    )).toArray();

    return (
      <div style={styles.container}>
      <table style={styles.table}>
        <tbody>
          {rows}
        </tbody>
      </table>
      </div>
    );
  }
}

var styles = {
  container: {
    position: 'relative',
    flex: 1,
    overflow: 'scroll',
  },

  table: {
    flex: 1,
    borderCollapse: 'collapse',
    width: '100%',
  },

  empty: {
    flex: 1,
    padding: 50,
    textAlign: 'center',
  },
};

module.exports = decorate({
  store: 'relayStore',
  listeners: () => ['queries', 'selectedQuery'],
  props(store, props) {
    return {
      queries: store.queries,
      selectQuery: id => store.selectQuery(id),
      selectedQuery: store.selectedQuery,
    };
  },
}, QueryList);
