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

const PropTypes = require('prop-types');

var React = require('react');
var PropVal = require('./PropVal');
var {getInvertedMid} = require('./Themes/utils');

import type {Theme} from './types';

type PropsProps = {
  props: any,
  inverted: boolean,
}

class Props extends React.Component<PropsProps> {
  context: {
    theme: Theme,
  };

  shouldComponentUpdate(nextProps: PropsProps): boolean {
    return nextProps.props !== this.props.props || nextProps.inverted !== this.props.inverted;
  }

  render() {
    var theme = this.context.theme;
    var {inverted, props} = this.props;
    if (!props || typeof props !== 'object') {
      return <span/>;
    }

    var names = Object.keys(props).filter(name => {
      return name[0] !== '_' && name !== 'children';
    });

    var items = [];

    names.slice(0, 3).forEach(name => {
      items.push(
        <span key={'prop-' + name} style={propStype(inverted, theme)}>
          <span style={attributeNameStyle(inverted, theme)}>{name}</span>
          =
          <PropVal val={props[name]} inverted={inverted}/>
        </span>
      );
    });

    if (names.length > 3) {
      items.push(<span key="ellipsis" style={ellipsisStyle(inverted, theme)}>…</span>);
    }
    return <span>{items}</span>;
  }
}

Props.contextTypes = {
  theme: PropTypes.object.isRequired,
};

const attributeNameStyle = (isInverted: boolean, theme: Theme) => ({
  color: isInverted ? getInvertedMid(theme.state02) : theme.special06,
});

const ellipsisStyle = (isInverted: boolean, theme: Theme) => ({
  color: isInverted ? getInvertedMid(theme.state02) : theme.special06,
});

const propStype = (isInverted: boolean, theme: Theme) => ({
  paddingLeft: 5,
  color: isInverted ? getInvertedMid(theme.state02) : theme.special06,
});

module.exports = Props;
