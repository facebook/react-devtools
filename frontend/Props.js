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
    return nextProps.props !== this.props.props || nextProps.selected !== this.props.selected;
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
    var propNameStyle = assign(
      {},
      styles.propName,
      this.props.selected && styles.propNameSelected
    );

    names.slice(0, 3).forEach(name => {
      items.push(
        <span key={'prop-' + name} style={styles.prop}>
          <span style={propNameStyle}>{name}</span>
          =
          <PropVal val={props[name]} selected={this.props.selected}/>
        </span>
      );
    });

    if (names.length > 3) {
      var ellipsisStyle = this.props.selected ? styles.ellipsisSelected : null;
      items.push(<span key="ellipsis" style={ellipsisStyle}>…</span>);
    }
    return <span>{items}</span>;
  }
}

var styles = {
  ellipsisSelected: {
    color: '#ccc',
  },

  prop: {
    paddingLeft: 5,
  },

  propName: {
    color: '#994500',
  },
  propNameSelected: {
    color: '#ccc',
  },
};

module.exports = Props;
