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

import type {Theme} from '../types';

const PropTypes = require('prop-types');
const React = require('react');

type Props = {
  title: string,
  hint?: React.Node,
  children: React.Node,
}

class DetailPaneSection extends React.Component<Props> {
  context: {
    theme: Theme,
  };

  render() {
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
  theme: PropTypes.object.isRequired,
};

const sectionStyle = (theme: Theme) => ({
  borderTop: `1px solid ${theme.base01}`,
  padding: '0.5rem',
  flexShrink: 0,
});

var styles = {
  title: {
    display: 'inline-block',
    marginRight: '0.5rem',
    lineHeight: '1.5rem',
  },
};

module.exports = DetailPaneSection;
