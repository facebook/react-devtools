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

import type {Theme} from './types';

class PropVal extends React.Component {
  context: {
    theme: Theme,
  };
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
    flash(node, this.context.theme.base0A, 'transparent', 1);
  }

  render() {
    return previewProp(this.props.val, !!this.props.nested, !!this.props.inverted, this.context.theme);
  }
}

PropVal.contextTypes = {
  theme: React.PropTypes.object.isRequired,
};

function previewProp(val: any, nested: boolean, inverted: boolean, theme: Theme) {
  var style;

  if (typeof val === 'number') {
    style = {
      color: inverted ? theme.base03 : theme.base09,
    };
    return <span style={style}>{val}</span>;
  }
  if (typeof val === 'string') {
    if (val.length > 50) {
      val = val.slice(0, 50) + '…';
    }

    style = {
      color: inverted ? theme.base03 : theme.base0B,
    };
    return (
      <span style={style}>"{val}"</span>
    );
  }
  if (typeof val === 'boolean') {
    style = {
      color: inverted ? theme.base03 : theme.base09,
    };
    return <span style={style}>{'' + val}</span>;
  }
  if (Array.isArray(val)) {
    if (nested) {
      style = {
        color: inverted ? theme.base03 : theme.base09,
      };
      return <span style={style}>[({val.length})]</span>;
    }
    return previewArray(val, inverted, theme);
  }
  if (!val) {
    style = {
      color: inverted ? theme.base03 : theme.base03,
    };
    return <span style={style}>{'' + val}</span>;
  }
  if (typeof val !== 'object') {
    style = {
      color: inverted ? theme.base03 : theme.base03,
    };
    return <span style={style}>…</span>;
  }

  switch (val[consts.type]) {
    case 'date': {
      style = {
        color: inverted ? theme.base03 : theme.base05,
      };
      return <span style={style}>{val[consts.name]}</span>;
    }
    case 'function': {
      style = {
        color: inverted ? theme.base03 : theme.base0D,
      };
      return <span style={style}>{val[consts.name] || 'fn'}()</span>;
    }
    case 'object': {
      style = {
        color: inverted ? theme.base03 : theme.base09,
      };
      return <span style={style}>{val[consts.name] + '{…}'}</span>;
    }
    case 'array': {
      style = {
        color: inverted ? theme.base03 : theme.base09,
      };
      return <span style={style}>Array[{val[consts.meta].length}]</span>;
    }
    case 'typed_array':
    case 'array_buffer':
    case 'data_view': {
      style = {
        color: inverted ? theme.base03 : theme.base05,
      };
      return <span style={style}>{`${val[consts.name]}[${val[consts.meta].length}]`}</span>;
    }
    case 'iterator': {
      style = {
        color: inverted ? theme.base03 : theme.base05,
      };
      return <span style={style}>{val[consts.name] + '(…)'}</span>;
    }
    case 'symbol': {
      style = {
        color: inverted ? theme.base03 : theme.base05,
      };
      // the name is "Symbol(something)"
      return <span style={style}>{val[consts.name]}</span>;
    }
  }

  if (nested) {
    style = {
      color: inverted ? theme.base03 : theme.base05,
    };
    return <span style={style}>{'{…}'}</span>;
  }

  return previewObject(val, inverted, theme);
}

function previewArray(val, inverted, theme) {
  var items = {};
  val.slice(0, 3).forEach((item, i) => {
    items['n' + i] = <PropVal val={item} nested={true} inverted={inverted} theme={theme} />;
    items['c' + i] = ', ';
  });
  if (val.length > 3) {
    items.last = '…';
  } else {
    delete items['c' + (val.length - 1)];
  }
  var style = {
    color: inverted ? theme.base03 : theme.base09,
  };
  return (
    <span style={style}>
      [{createFragment(items)}]
    </span>
  );
}

function previewObject(val, inverted, theme) {
  var names = Object.keys(val);
  var items = {};
  var attrStyle = {
    color: inverted ? theme.base02 : theme.base0F,
  };
  names.slice(0, 3).forEach((name, i) => {
    items['k' + i] = <span style={attrStyle}>{name}</span>;
    items['c' + i] = ': ';
    items['v' + i] = <PropVal val={val[name]} nested={true} inverted={inverted} theme={theme} />;
    items['m' + i] = ', ';
  });
  if (names.length > 3) {
    items.rest = '…';
  } else {
    delete items['m' + (names.length - 1)];
  }
  var style = {
    color: inverted ? theme.base03 : theme.base09,
  };
  return (
    <span style={style}>
      {'{'}{createFragment(items)}{'}'}
    </span>
  );
}

module.exports = PropVal;
