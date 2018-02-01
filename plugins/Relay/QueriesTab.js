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
var {sansSerif} = require('../../frontend/Themes/Fonts');
var QueryList = require('./QueryList');
var QueryViewer = require('./QueryViewer');
var SplitPane = require('../../frontend/SplitPane');

type Props = {
  isSplit: boolean,
};

class QueriesTab extends React.Component<Props> {
  render() {
    var contents;
    if (!this.props.isSplit) {
      contents = <QueryList />;
    } else {
      contents = (
        <SplitPane
          initialWidth={500}
          initialHeight={500}
          left={() => <QueryList />}
          right={() => <QueryViewer />}
          isVertical={false}
        />
      );
    }

    return (
      <div style={styles.container}>
        {contents}
      </div>
    );
  }
}

var styles = {
  container: {
    fontFamily: sansSerif.family,
    fontSize: sansSerif.sizes.normal,
    flex: 1,
    display: 'flex',
  },
};

module.exports = decorate({
  store: 'relayStore',
  listeners: () => ['selectedQuery'],
  props(store) {
    return {
      isSplit: !!store.selectedQuery,
    };
  },
}, QueriesTab);
