/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

var BananaSlugFrontendControl = require('../plugins/BananaSlug/BananaSlugFrontendControl');
var React = require('react');

var decorate = require('./decorate');

class SettingsPane extends React.Component {
  render() {
    return (
      <div style={styles.container}>
        <BananaSlugFrontendControl {...this.props} />
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
  listeners() {
    return ['bananaslugchange'];
  },
  props(store) {
    return {
      state: store.bananaslugState,
      onChange: state => store.changeBananaSlug(state),
    };
  },
}, SettingsPane);

module.exports = Wrapped;
