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
var {sansSerif} = require('../../frontend/Themes/Fonts');
var Query = require('./Query');

type Props = {
  queries: OrderedMap,
  selectQuery: (id: string) => void,
  selectedQuery: ?string,
};

class QueryList extends React.Component<Props> {
  render() {
    if (!this.props.queries.count()) {
      return <div style={styles.empty}>No Relay Queries logged</div>;
    }

    const rows = [];
    let odd = false;
    let lastRequestNumber = -1;
    this.props.queries.forEach(query => {
      const requestNumber = query.get('requestNumber');
      if (lastRequestNumber !== requestNumber) {
        lastRequestNumber = requestNumber;
        rows.push(
          <tr key={'request' + requestNumber}>
            <td colSpan="4" style={styles.grouper}>
              Request {requestNumber}
            </td>
          </tr>
        );
        odd = false;
      }
      rows.push(
        <Query
          data={query}
          isSelected={query.get('id') === this.props.selectedQuery}
          key={query.get('id')}
          oddRow={odd}
          onSelect={() => this.props.selectQuery(query.get('id'))}
        />
      );
      odd = !odd;
    });

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

  grouper: {
    fontWeight: 'bold',
    fontSize: sansSerif.sizes.normal,
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
