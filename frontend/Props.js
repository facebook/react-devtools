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
var assign = require('object-assign');
var PropVal = require('./PropVal');

class Props extends React.Component {
  props: Object;
  shouldComponentUpdate(nextProps: Object): boolean {
    return nextProps.props !== this.props.props || nextProps.inverted !== this.props.inverted;
  }

  render() {
    var props = this.props.props;
    if (!props || typeof props !== 'object') {
      return <span/>;
    }

    var names = Object.keys(props).filter(name => {
      return name[0] !== '_' && name !== 'children';
    });

    var items = [];
    var className = 'JsxAttributeName';
    if (this.props.inverted) {
      className += ' inverted';
    }

    names.slice(0, 3).forEach(name => {
      items.push(
        <span key={'prop-' + name} style={styles.prop}>
          <span className={className}>{name}</span>
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

var styles = {
  ellipsisInverted: {
    color: '#ccc',
  },

  prop: {
    paddingLeft: 5,
  },
};

module.exports = Props;
