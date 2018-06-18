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
var PropTypes = require('prop-types');

var consts = require('../agent/consts');
var {getInvertedWeak} = require('./Themes/utils');
var flash = require('./flash');

import type {Theme} from './types';

type Props = {
  val: any,
  nested?: boolean,
  inverted?: boolean,
};

class PropVal extends React.Component<Props> {
  context: {
    theme: Theme,
  };
  componentDidUpdate(prevProps: Object) {
    if (this.props.val === prevProps.val) {
      return;
    }
    if (this.props.val && prevProps.val && typeof this.props.val === 'object' && typeof prevProps.val === 'object') {
      return;
    }
    var node = ReactDOM.findDOMNode(this);
    // $FlowFixMe
    flash(node, this.context.theme.state04, 'transparent', 1);
  }

  render() {
    return previewProp(this.props.val, !!this.props.nested, !!this.props.inverted, this.context.theme);
  }
}

PropVal.contextTypes = {
  theme: PropTypes.object.isRequired,
};

function previewProp(val: any, nested: boolean, inverted: boolean, theme: Theme) {
  let style = {
    color: inverted ? getInvertedWeak(theme.state02) : theme.special01,
  };

  if (typeof val === 'number') {
    return <span style={style}>{val}</span>;
  }
  if (typeof val === 'string') {
    style = {
      color: inverted ? getInvertedWeak(theme.state02) : theme.special02,
    };
    if (val.length > 50) {
      val = val.slice(0, 50) + '…';
    }

    return (
      <span style={style}>"{val}"</span>
    );
  }
  if (typeof val === 'boolean') {
    return <span style={style}>{'' + val}</span>;
  }
  if (Array.isArray(val)) {
    style = {
      color: inverted ? getInvertedWeak(theme.state02) : theme.special02,
    };
    if (nested) {
      return <span style={style}>[({val.length})]</span>;
    }
    return previewArray(val, inverted, theme);
  }
  if (!val) {
    style = {
      color: inverted ? getInvertedWeak(theme.state02) : theme.base03,
    };
    return <span style={style}>{'' + val}</span>;
  }
  if (typeof val !== 'object') {
    style = {
      color: inverted ? getInvertedWeak(theme.state02) : theme.special04,
    };
    return <span style={style}>…</span>;
  }

  switch (val[consts.type]) {
    case 'date': {
      return <span style={style}>{val[consts.name]}</span>;
    }
    case 'function': {
      style = {
        color: inverted ? getInvertedWeak(theme.state02) : theme.special04,
      };
      return <span style={style}>{val[consts.name] || 'fn'}()</span>;
    }
    case 'object': {
      return <span style={style}>{val[consts.name] + '{…}'}</span>;
    }
    case 'array': {
      style = {
        color: inverted ? getInvertedWeak(theme.state02) : theme.special02,
      };
      return <span style={style}>Array[{val[consts.meta].length}]</span>;
    }
    case 'typed_array':
    case 'array_buffer':
    case 'data_view': {
      style = {
        color: inverted ? getInvertedWeak(theme.state02) : theme.special02,
      };
      return <span style={style}>{`${val[consts.name]}[${val[consts.meta].length}]`}</span>;
    }
    case 'iterator': {
      style = {
        color: inverted ? getInvertedWeak(theme.state02) : theme.base05,
      };
      return <span style={style}>{val[consts.name] + '(…)'}</span>;
    }
    case 'symbol': {
      style = {
        color: inverted ? getInvertedWeak(theme.state02) : theme.base05,
      };
      // the name is "Symbol(something)"
      return <span style={style}>{val[consts.name]}</span>;
    }
  }

  if (nested) {
    style = {
      color: inverted ? getInvertedWeak(theme.state02) : theme.base05,
    };
    return <span style={style}>{'{…}'}</span>;
  }

  return previewObject(val, inverted, theme);
}

function previewArray(val, inverted, theme) {
  var items = [];
  val.slice(0, 3).forEach((item, i) => {
    if (i > 0) {
      items.push(', ');
    }
    items.push(
      <PropVal key={i} val={item} nested={true} inverted={inverted} theme={theme} />
    );
  });
  var style = {
    color: inverted ? theme.base03 : theme.special01,
  };
  return (
    <span style={style}>
      {'['}{items}{val.length > 3 ? ', …' : ''}{']'}
    </span>
  );
}

function previewObject(val, inverted, theme) {
  var names = Object.keys(val);
  var items = [];
  var attrStyle = {
    color: inverted ? getInvertedWeak(theme.state02) : theme.special06,
  };
  names.slice(0, 3).forEach((name, i) => {
    items.push( // Fragment
      <span key={i}>
        {i > 0 ? ', ' : ''}
        <span style={attrStyle}>{name}</span>
        {': '}
        <PropVal val={val[name]} nested={true} inverted={inverted} theme={theme} />
      </span>
    );
  });
  var style = {
    color: inverted ? getInvertedWeak(theme.state02) : theme.special01,
  };
  return (
    <span style={style}>
      {'{'}{items}{names.length > 3 ? ', …' : ''}{'}'}
    </span>
  );
}

module.exports = PropVal;
