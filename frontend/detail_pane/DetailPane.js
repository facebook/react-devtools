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

var assign = require('object-assign');
var React = require('react');

import type {Base16Theme} from '../Themes/Themes';

class DetailPane extends React.Component {
  context: {
    theme: Base16Theme,
  };

  render(): React.Element {
    const {theme} = this.context;
    const headerNameStyle = assign({}, styles.headerName, {
      color: theme.base08,
    });

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={headerNameStyle}>
            {this.props.header}
          </span>
          <span style={styles.consoleHint}>{this.props.hint}</span>
        </div>
        {this.props.children}
      </div>
    );
  }
}

DetailPane.contextTypes = {
  theme: React.PropTypes.object.isRequired,
};

var styles = {
  container: {
    fontSize: '11px',
    // TODO figure out what font Chrome devtools uses on Windows
    fontFamily: 'Menlo, Consolas, monospace',
    overflow: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',

    cursor: 'default',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    userSelect: 'none',
  },
  header: {
    padding: 5,
    maxHeight: 38,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  headerName: {
    flex: 1,
    fontSize: 16,

    cursor: 'text',
    WebkitUserSelect: 'text',
    MozUserSelect: 'text',
    userSelect: 'text',
  },
  consoleHint: {
    float: 'right',
    fontSize: 11,
    marginLeft: 10,
  },
};

module.exports = DetailPane;
