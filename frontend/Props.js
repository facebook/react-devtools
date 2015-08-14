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

class Props {
  props: Object;
  shouldComponentUpdate(nextProps: Object): boolean {
    if (nextProps === this.props) {
      return false;
    }
    return true;
  }

  render(): ReactElement {
    var props = this.props.props;
    if (!props || typeof props !== 'object') {
      return <span/>;
    }

    var names = Object.keys(props).filter(name => {
      return name[0] !== '_' && name !== 'children';
    });

    var items = [];
    names.slice(0, 3).forEach(name => {
      items.push(
        <span key={name} style={styles.prop}>
          <span style={styles.propName}>{name}</span>
          =
          <PropVal val={props[name]}/>
        </span>
      );
    });

    if (names.length > 3) {
      items.push('…');
    }
    return <span>{items}</span>;
  }
}

var styles = {
  prop: {
    paddingLeft: 5,
  },

  propName: {
    color: 'rgb(165, 103, 42)',
  },
};


module.exports = Props;
