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

import type {Theme} from '../types';

// $FlowFixMe From the upgrade to Flow 64
class DetailPaneSection extends React.Component {
  context: {
    theme: Theme,
  };

  // $FlowFixMe From the upgrade to Flow 64
  render(): React.Element {
    const {theme} = this.context;
    const {children, hint} = this.props;
    return (
      <div style={sectionStyle(theme)}>
        <strong style={styles.title}>{this.props.title}</strong>
        {hint}
        {children}
      </div>
    );
  }
}

DetailPaneSection.contextTypes = {
  theme: React.PropTypes.object.isRequired,
};

const sectionStyle = (theme: Theme) => ({
  borderTop: `1px solid ${theme.base01}`,
  padding: '0.25rem',
  flexShrink: 0,
});

var styles = {
  title: {
    display: 'inline-block',
    marginRight: '0.25rem',
  },
};

module.exports = DetailPaneSection;
