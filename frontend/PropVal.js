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
var ReactDOM = require('react-dom');

var consts = require('../agent/consts');
var createFragment = require('react-addons-create-fragment');
var flash = require('./flash');
var valueStyles = require('./value-styles');

class PropVal extends React.Component {
  props: {
    val: any,
    nested?: boolean,
  };
  componentDidUpdate(prevProps: Object) {
    if (this.props.val === prevProps.val) {
      return;
    }
    if (this.props.val && prevProps.val && typeof this.props.val === 'object' && typeof prevProps.val === 'object') {
      return;
    }
    var node:any = ReactDOM.findDOMNode(this);
    if (node) {
      flash(node, 'rgba(0,255,0,1)', 'transparent', 1);
    }
  }

  render() {
    return previewProp(this.props.val, !!this.props.nested);
  }
}

function previewProp(val: any, nested: boolean) {
  if (typeof val === 'number') {
    return <span style={valueStyles.number}>{val}</span>;
  }
  if (typeof val === 'string') {
    if (val.length > 50) {
      val = val.slice(0, 50) + '…';
    }

    return (
      <span style={valueStyles.string}>
        <span style={{ color: 'rgb(168, 148, 166)' }}>"</span>
          {val}
        <span style={{ color: 'rgb(168, 148, 166)' }}>"</span>
      </span>
    );
  }
  if (typeof val === 'boolean') {
    return <span style={valueStyles.bool}>{'' + val}</span>;
  }
  if (Array.isArray(val)) {
    if (nested) {
      return <span style={valueStyles.array}>[({val.length})]</span>;
    }
    return previewArray(val);
  }
  if (!val) {
    return <span style={valueStyles.empty}>{'' + val}</span>;
  }
  if (typeof val !== 'object') {
    return <span>…</span>;
  }
  if (val[consts.type]) {
    var type = val[consts.type];
    if (type === 'function') {
      return (
        <span style={valueStyles.func}>
          {val[consts.name] || 'fn'}()
        </span>
      );
    }
    if (type === 'object') {
      return <span style={valueStyles.object}>{val[consts.name] + '{…}'}</span>;
    }
    if (type === 'array') {
      return <span>Array[{val[consts.meta].length}]</span>;
    }
    if (type === 'symbol') {
      // the name is "Symbol(something)"
      return <span style={valueStyles.symbol}>{val[consts.name]}</span>;
    }
  }
  if (nested) {
    return <span>{'{…}'}</span>;
  }
  return previewObject(val);
}

function previewArray(val) {
  var items = {};
  val.slice(0, 3).forEach((item, i) => {
    items['n' + i] = <PropVal val={item} nested={true} />;
    items['c' + i] = ', ';
  });
  if (val.length > 3) {
    items.last = '…';
  } else {
    delete items['c' + (val.length - 1)];
  }
  return (
    <span style={valueStyles.array}>
      [{createFragment(items)}]
    </span>
  );
}

function previewObject(val) {
  var names = Object.keys(val);
  var items = {};
  names.slice(0, 3).forEach((name, i) => {
    items['k' + i] = <span style={valueStyles.attr}>{name}</span>;
    items['c' + i] = ': ';
    items['v' + i] = <PropVal val={val[name]} nested={true} />;
    items['m' + i] = ', ';
  });
  if (names.length > 3) {
    items.rest = '…';
  } else {
    delete items['m' + (names.length - 1)];
  }
  return (
    <span style={valueStyles.object}>
      {'{'}{createFragment(items)}{'}'}
    </span>
  );
}

module.exports = PropVal;
