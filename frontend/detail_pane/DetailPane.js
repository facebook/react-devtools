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

var {monospace} = require('../Themes/Fonts');
var React = require('react');

type Props = {
  children: React.Node,
}

class DetailPane extends React.Component<Props> {
  render() {
    return (
      <div style={styles.container}>
        {this.props.children}
      </div>
    );
  }
}

var styles = {
  container: {
    fontSize: monospace.sizes.normal,
    fontFamily: monospace.family,
    overflow: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
};

module.exports = DetailPane;
