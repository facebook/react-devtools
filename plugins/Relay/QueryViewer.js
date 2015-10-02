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

import DataView from '../../frontend/DataView/DataView';
import DetailPane from '../../frontend/detail_pane/DetailPane';
import DetailPaneSection from '../../frontend/detail_pane/DetailPaneSection';
import React from 'react';

import decorate from '../../frontend/decorate';
import tidyGraphQL from './tidyGraphQL';

class QueryViewer {
  props: {
    data: Map,
    inspect: (path: Array<string>, cb: () => void) => void,
  };
  render(): ReactElement {
    var data = this.props.data;
    var status = data.get('status');

    var resultBlock = null;
    if (status === 'success') {
      resultBlock =
        <DetailPaneSection title="Response">
          <DataView
            data={data.get('response')}
            readOnly={true}
            showMenu={false}
            inspect={this.props.inspect}
            path={['response']}
          />
        </DetailPaneSection>;
    } else if (status === 'failure') {
      resultBlock =
        <DetailPaneSection title="Error">
          <DataView
            data={data.get('error')}
            readOnly={true}
            showMenu={false}
            inspect={this.props.inspect}
            path={['error']}
          />
        </DetailPaneSection>;
    }

    return (
      <DetailPane header={data.get('type') + ': ' + data.get('name')}>
        <DetailPaneSection title="Start">
          <div>
            {new Date(data.get('start')).toLocaleTimeString()}
          </div>
        </DetailPaneSection>
        <DetailPaneSection title="Status">
          <div>
            {status}
          </div>
        </DetailPaneSection>
        <DetailPaneSection title="Duration">
          <div>
            {data.get('end') - data.get('start')}ms
          </div>
        </DetailPaneSection>
        <DetailPaneSection title="Query">
          <div style={styles.text}>
            {tidyGraphQL(data.get('text'))}
          </div>
        </DetailPaneSection>
        <DetailPaneSection title="Variables">
          <DataView
            data={data.get('variables')}
            readOnly={true}
            showMenu={false}
            inspect={this.props.inspect}
            path={['variables']}
          />
        </DetailPaneSection>
        {resultBlock}
      </DetailPane>
    );
  }
}

var styles = {
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
