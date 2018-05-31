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

const PropTypes = require('prop-types');

var React = require('react');
var decorate = require('../../frontend/decorate');

import type {Theme} from '../../frontend/types';

type Props = {
  dataIDs: Array<{id: string, queries: Array<Map<string, string>>}>,
  jumpToData: (id: string) => void,
  jumpToQuery: (queryID: string) => void,
};

class ElementPanel extends React.Component<Props> {
  context: {
    theme: Theme,
  };

  render() {
    if (!this.props.dataIDs.length) {
      return <span/>;
    }
    const {theme} = this.context;
    return (
      <div>
        Relay Nodes
        <ul style={styles.dataIDs}>
        {this.props.dataIDs.map(({id, queries}) => (
          <li style={dataNodeStyle(theme)}>
            <div style={dataIDStyle(theme)} onClick={() => this.props.jumpToData(id)}>
              ID: {id}
            </div>
            <ul style={styles.queries}>
              {queries.map(query => (
                <li style={styles.queryID} onClick={() => {
                  var queryID = query.get('id');
                  if (queryID) {
                    this.props.jumpToQuery(queryID);
                  }
                }}>
                  {query.get('name')}
                </li>
              ))}
              {!queries.length && <li style={noQueriesStyle(theme)}>No Queries</li>}
            </ul>
          </li>
        ))}
        </ul>
      </div>
    );
  }
}

ElementPanel.contextTypes = {
  theme: PropTypes.object.isRequired,
};

const dataNodeStyle = (theme: Theme) => ({
  marginBottom: 5,
  border: `1px solid ${theme.base02}`,
});

const dataIDStyle = (theme: Theme) => ({
  cursor: 'pointer',
  padding: '2px 4px',
  backgroundColor: theme.base02,
});

const noQueriesStyle = (theme: Theme) => ({
  color: theme.base03,
  padding: '2px 4px',
});

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
  queryID: {
    cursor: 'pointer',
    padding: '2px 4px',
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
      jumpToData: dataID => store.jumpToDataID(dataID),
      jumpToQuery: queryID => store.jumpToQuery(queryID),
    };
  },
}, ElementPanel);
