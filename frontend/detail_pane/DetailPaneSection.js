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

class DetailPaneSection extends React.Component {
  render(): React.Element<any> {
    var {
      children,
      hint,
    } = this.props;
    return (
      <div style={styles.section}>
        <strong style={styles.title}>{this.props.title}</strong>
        {hint}
        {children}
      </div>
    );
  }
}

var styles = {
  section: {
    borderTop: '1px solid #eee',
    padding: 5,
    marginBottom: 5,
    flexShrink: 0,
  },
  title: {
    marginRight: 7,
  },
};

module.exports = DetailPaneSection;
