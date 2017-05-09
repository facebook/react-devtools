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
var PropVal = require('./PropVal');

import type {Base16Theme} from './Themes/Themes';

class Props extends React.Component {
  context: {
    theme: Base16Theme,
  };
  shouldComponentUpdate(nextProps: Object): boolean {
    return nextProps.props !== this.props.props || nextProps.inverted !== this.props.inverted;
  }

  render() {
    var theme = this.context.theme;
    var props = this.props.props;
    if (!props || typeof props !== 'object') {
      return <span/>;
    }

    var names = Object.keys(props).filter(name => {
      return name[0] !== '_' && name !== 'children';
    });

    var items = [];
    // TODO (bvaughn) Handle inverted
    var attributeNameStyle = {
      color: theme.base0F,
    };

    names.slice(0, 3).forEach(name => {
      items.push(
        <span key={'prop-' + name} style={styles.prop}>
          <span style={attributeNameStyle}>{name}</span>
          =
          <PropVal val={props[name]} inverted={this.props.inverted}/>
        </span>
      );
    });

    if (names.length > 3) {
      var ellipsisStyle = this.props.inverted ? styles.ellipsisInverted : null;
      items.push(<span key="ellipsis" style={ellipsisStyle}>…</span>);
    }
    return <span>{items}</span>;
  }
}

Props.contextTypes = {
  theme: React.PropTypes.object.isRequired,
};

var styles = {
  ellipsisInverted: {
    color: '#ccc',
  },

  prop: {
    paddingLeft: 5,
  },
};

module.exports = Props;
