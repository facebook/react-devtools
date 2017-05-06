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

class PropVal extends React.Component {
  props: {
    val: any,
    nested?: boolean,
    inverted?: boolean,
  };
  componentDidUpdate(prevProps: Object) {
    if (this.props.val === prevProps.val) {
      return;
    }
    if (this.props.val && prevProps.val && typeof this.props.val === 'object' && typeof prevProps.val === 'object') {
      return;
    }
    var node = ReactDOM.findDOMNode(this);
    flash(node, 'rgba(0,255,0,1)', 'transparent', 1);
  }

  render() {
    return previewProp(this.props.val, !!this.props.nested, !!this.props.inverted);
  }
}

var invertedStyle = {
  color: 'white',
};

function previewProp(val: any, nested: boolean, inverted: boolean) {
  if (typeof val === 'number') {
    const style = inverted ? invertedStyle : null;
    return <span className='CodeNumber' style={style}>{val}</span>;
  }
  if (typeof val === 'string') {
    if (val.length > 50) {
      val = val.slice(0, 50) + '…';
    }

    const style = inverted ? invertedStyle : null;
    return (
      <span className='CodeString' style={style}>"{val}"</span>
    );
  }
  if (typeof val === 'boolean') {
    const style = inverted ? invertedStyle : null;
    return <span className='CodeBoolean' style={style}>{'' + val}</span>;
  }
  if (Array.isArray(val)) {
    if (nested) {
      const style = inverted ? invertedStyle : null;
      return <span className='CodeArray' style={style}>[({val.length})]</span>;
    }
    return previewArray(val, inverted);
  }
  if (!val) {
    const style = inverted ? invertedStyle : null;
    return <span className='CodeEmpty' style={style}>{'' + val}</span>;
  }
  if (typeof val !== 'object') {
    const style = inverted ? invertedStyle : null;
    return <span className='CodeNull' style={style}>…</span>;
  }

  switch (val[consts.type]) {
    case 'date': {
      const style = inverted ? invertedStyle : null;
      return <span className='CodeDate' style={style}>{val[consts.name]}</span>;
    }
    case 'function': {
      const style = inverted ? invertedStyle : null;
      return <span className='CodeFunction' style={style}>{val[consts.name] || 'fn'}()</span>;
    }
    case 'object': {
      const style = inverted ? invertedStyle : null;
      return <span className='CodeObject' style={style}>{val[consts.name] + '{…}'}</span>;
    }
    case 'array': {
      const style = inverted ? invertedStyle : null;
      return <span style={style}>Array[{val[consts.meta].length}]</span>;
    }
    case 'typed_array':
    case 'array_buffer':
    case 'data_view': {
      const style = inverted ? invertedStyle : null;
      return <span className='CodeObject' style={style}>{`${val[consts.name]}[${val[consts.meta].length}]`}</span>;
    }
    case 'iterator': {
      const style = inverted ? invertedStyle : null;
      return <span className='CodeObject' style={style}>{val[consts.name] + '(…)'}</span>;
    }
    case 'symbol': {
      const style = inverted ? invertedStyle : null;
      // the name is "Symbol(something)"
      return <span className='CodeSymbol' style={style}>{val[consts.name]}</span>;
    }
  }

  if (nested) {
    const style = inverted ? invertedStyle : null;
    return <span style={style}>{'{…}'}</span>;
  }

  return previewObject(val, inverted);
}

function previewArray(val, inverted) {
  var items = {};
  val.slice(0, 3).forEach((item, i) => {
    items['n' + i] = <PropVal val={item} nested={true} inverted={inverted} />;
    items['c' + i] = ', ';
  });
  if (val.length > 3) {
    items.last = '…';
  } else {
    delete items['c' + (val.length - 1)];
  }
  var style = inverted ? invertedStyle : null;
  return (
    <span className='CodeArray' style={style}>
      [{createFragment(items)}]
    </span>
  );
}

function previewObject(val, inverted) {
  var names = Object.keys(val);
  var items = {};
  var attrStyle = inverted ? invertedStyle : null;
  names.slice(0, 3).forEach((name, i) => {
    items['k' + i] = <span className='CodeAttribute' style={attrStyle}>{name}</span>;
    items['c' + i] = ': ';
    items['v' + i] = <PropVal val={val[name]} nested={true} inverted={inverted} />;
    items['m' + i] = ', ';
  });
  if (names.length > 3) {
    items.rest = '…';
  } else {
    delete items['m' + (names.length - 1)];
  }
  var style = inverted ? invertedStyle : null;
  return (
    <span className='CodeObject' style={style}>
      {'{'}{createFragment(items)}{'}'}
    </span>
  );
}

module.exports = PropVal;
