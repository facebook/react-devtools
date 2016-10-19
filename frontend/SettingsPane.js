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

class ControlsPane extends React.Component {
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
    borderBottom: '1px solid #dadada',
    color: 'rgb(48, 57, 66)',
    padding: '5px 6px',
    display: 'flexbox',
    alignItems: 'center',
    position: 'relative',
  },
};

module.exports = ControlsPane;
