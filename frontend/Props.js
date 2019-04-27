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
const React = require('react');
const {getInvertedMid, getInvertedWeak} = require('./Themes/utils');

const {Fragment} = React;

import type {Theme} from './types';

type PropsProps = {
  props: any,
  inverted: boolean,
};

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
      return null;
    }

    const propKeys = Object.keys(props);
    var names = propKeys.filter(name => {
      const value = props[name];
      return name[0] !== '_' && name !== 'children' && (
        typeof value === 'boolean' ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        value == null
      );
    });

    var items = [];

    names.forEach(name => {
      const valueIsString = typeof props[name] === 'string';

      let displayValue = props[name];
      if (displayValue === undefined) {
        displayValue = 'undefined';
      } else if (displayValue === null) {
        displayValue = 'null';
      } else if (typeof displayValue === 'boolean') {
        displayValue = displayValue ? 'true' : 'false';
      } else if (valueIsString && displayValue.length > 50) {
        displayValue = displayValue.slice(0, 50) + '…';
      }

      items.push(
        <Fragment key={'prop-' + name}>
          &nbsp;
          <span style={{
            color: inverted ? getInvertedMid(theme.state02) : theme.special06,
          }}>
            {name}
          </span>
          {valueIsString ? '="' : '={'}
          <span style={{
            color: inverted ? getInvertedWeak(theme.state02) : theme.special02,
          }}>
            {displayValue}
          </span>
          {valueIsString ? '"' : '}'}
        </Fragment>
      );
    });

    return items;
  }
}

Props.contextTypes = {
  theme: PropTypes.object.isRequired,
};

module.exports = Props;
