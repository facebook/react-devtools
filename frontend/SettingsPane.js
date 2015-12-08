/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * $FLowFixMe
 * - thinks all react component classes must inherit from React.Component
 */
'use strict';

var BananaSlugControl = require('../plugins/BananaSlug/BananaSlugControl')
var React = require('react');

var decorate = require('./decorate');

class SearchPane extends React.Component {
  render() {
    return (
      <div style={styles.container}>
        <BananaSlugControl
          enabled={this.props.isBananaSlugEnabled}
          onToggle={this.props.onBananaSlugToggle}
        />
      </div>
    );
  }
}

var styles = {
  container: {
    backgroundColor: '#efefef',
    padding: '2px 4px',
    display: 'flex',
    flexShrink: 0,
    position: 'relative',
  },
};

var Wrapped = decorate({
  listeners(props) {
    return ['isBananaSlugEnabled'];
  },
  props(store) {
    return {
      isBananaSlugEnabled: store.isBananaSlugEnabled,
      onBananaSlugToggle: enabled => store.setBananaSlugEnabled(enabled),
    };
  },
}, SearchPane);

module.exports = Wrapped;
