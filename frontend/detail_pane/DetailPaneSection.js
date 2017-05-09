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

import type {Base16Theme} from '../types';

class DetailPaneSection extends React.Component {
  context: {
    theme: Base16Theme,
  };

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

const sectionStyle = (theme: Base16Theme) => ({
  borderTop: `1px solid ${theme.base01}`,
  padding: 5,
  marginBottom: 5,
  flexShrink: 0,
});

var styles = {
  title: {
    marginRight: 7,
  },
};

module.exports = DetailPaneSection;
