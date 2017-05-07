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

import type {Base16Theme} from '../theme';
import type {DOMEvent} from '../types';

var React = require('react');
var Simple = require('./Simple');

var assign = require('object-assign');
var consts = require('../../agent/consts');
var decorate = require('../decorate');
var previewComplex = require('./previewComplex');

type Inspect = (path: Array<string>, cb: () => void) => void;
type ShowMenu = boolean | (e: DOMEvent, val: any, path: Array<string>, name: string) => void;

type DataViewProps = {
  data: Object,
  path: Array<string>,
  inspect: Inspect,
  showMenu: ShowMenu,
  startOpen?: boolean,
  noSort?: boolean,
  readOnly?: boolean,
  theme: Base16Theme,
};

class DataView extends React.Component {
  props: DataViewProps;

  renderSparseArrayHole(count: number, key: string) {
    return (
      <li key={key}>
        <div style={styles.head}>
          <div style={assign({}, styles.name, styles.sparseArrayFiller)}>
            undefined × {count}
          </div>
        </div>
      </li>
    );
  }

  renderItem(name: string, key: string) {
    return (
      <DataItem
        key={key}
        name={name}
        path={this.props.path.concat([name])}
        startOpen={this.props.startOpen}
        inspect={this.props.inspect}
        showMenu={this.props.showMenu}
        readOnly={this.props.readOnly}
        theme={this.props.theme}
        value={this.props.data[name]} />
    );
  }

  render() {
    var data = this.props.data;
    if (!data) {
      return <div style={styles.missing}>null</div>;
    }

    var isArray = Array.isArray(data);
    var elements = [];
    if (isArray) {
      // Iterate over array, filling holes with special items
      var lastIndex = -1;
      data.forEach((item, i) => {
        if (lastIndex < i - 1) {
          // Have we skipped over a hole?
          var holeCount = (i - 1) - lastIndex;
          elements.push(
            this.renderSparseArrayHole(holeCount, i + '-hole')
          );
        }
        elements.push(this.renderItem(i, i));
        lastIndex = i;
      });
      if (lastIndex < data.length - 1) {
        // Is there a hole at the end?
        var holeCount = (data.length - 1) - lastIndex;
        elements.push(
          this.renderSparseArrayHole(holeCount, lastIndex + '-hole')
        );
      }
    } else {
      // Iterate over a regular object
      var names = Object.keys(data);
      if (!this.props.noSort) {
        names.sort(alphanumericSort);
      }
      names.forEach((name, i) => {
        elements.push(this.renderItem(name, name));
      });
    }

    if (!elements.length) {
      return (
        <div style={styles.empty}>
          {isArray ? 'Empty array' : 'Empty object'}
        </div>
      );
    }

    return (
      <ul style={styles.container}>
        {data[consts.proto] &&
          <DataItem
            key={'__proto__'}
            name={'__proto__'}
            path={this.props.path.concat(['__proto__'])}
            startOpen={this.props.startOpen}
            inspect={this.props.inspect}
            showMenu={this.props.showMenu}
            readOnly={this.props.readOnly}
            value={this.props.data[consts.proto]}
          />}

        {elements}
      </ul>
    );
  }
}

class DataItem extends React.Component {
  props: {
    path: Array<string>,
    inspect: Inspect,
    showMenu: ShowMenu,
    startOpen?: boolean,
    noSort?: boolean,
    readOnly?: boolean,
    name: string,
    value: any,
    theme: Base16Theme,
  };
  defaultProps: {};
  state: {open: boolean, loading: boolean};

  constructor(props) {
    super(props);
    this.state = {open: !!this.props.startOpen, loading: false};
  }

  componentDidMount() {
    if (this.state.open && this.props.value && this.props.value[consts.inspected] === false) {
      this.inspect();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.open && nextProps.value && nextProps.value[consts.inspected] === false) {
      this.inspect();
    }
  }

  inspect() {
    this.setState({loading: true, open: true});
    this.props.inspect(this.props.path, () => {
      this.setState({loading: false});
    });
  }

  toggleOpen() {
    if (this.state.loading) {
      return;
    }
    if (this.props.value && this.props.value[consts.inspected] === false) {
      this.inspect();
      return;
    }

    this.setState({
      open: !this.state.open,
    });
  }

  toggleBooleanValue(e) {
    this.context.onChange(this.props.path, e.target.checked);
  }

  render() {
    var theme = this.props.theme;
    var data = this.props.value;
    var otype = typeof data;
    var complex = true;
    var preview;
    if (otype === 'number' || otype === 'string' || data == null /* null or undefined */ || otype === 'boolean') {
      preview = (
        <Simple
          readOnly={this.props.readOnly}
          path={this.props.path}
          data={data}
        />
      );
      complex = false;
    } else {
      preview = previewComplex(data, theme);
    }

    var inspectable = !data || !data[consts.meta] || !data[consts.meta].uninspectable;
    var open = inspectable && this.state.open && (!data || data[consts.inspected] !== false);
    var opener = null;

    if (complex && inspectable) {
      opener = (
        <div
          onClick={this.toggleOpen.bind(this)}
          style={styles.opener}>
          {open ?
            <span style={styles.expandedArrow} /> :
            <span style={styles.collapsedArrow} />}
        </div>
      );
    } else if (otype === 'boolean' && !this.props.readOnly) {
      opener = (
        <input
          checked={data}
          onChange={this.toggleBooleanValue.bind(this)}
          style={styles.toggler}
          type="checkbox"
        />
      );
    }

    var children = null;
    if (complex && open) {
      var readOnly = this.props.readOnly || (data[consts.meta] && data[consts.meta].readOnly);
      // TODO path
      children = (
        <div style={styles.children}>
          <DataView
            data={data}
            path={this.props.path}
            inspect={this.props.inspect}
            showMenu={this.props.showMenu}
            readOnly={readOnly}
          />
        </div>
      );
    }

    var name = this.props.name;
    if (name.length > 50) {
      name = name.slice(0, 50) + '…';
    }

    var style = assign({},
      complex && styles.complexName,
      {color: theme.base0B},
    );

    return (
      <li>
        <div style={styles.head}>
          {opener}
          <div
            style={style}
            onClick={inspectable && this.toggleOpen.bind(this)}
          >
            {name}:
          </div>
          <div
            onContextMenu={e => {
              if (typeof this.props.showMenu === 'function') {
                this.props.showMenu(e, this.props.value, this.props.path, name);
              }
            }}
            style={styles.preview}
          >
            {preview}
          </div>
        </div>
        {children}
      </li>
    );
  }
}

DataItem.contextTypes = {
  onChange: React.PropTypes.func,
};

var WrappedDataView = decorate({
  listeners() {
    return ['theme'];
  },
  props(store, props) {
    return {
      ...props,
      theme: store.theme,
    };
  },
}, DataView);

function alphanumericSort(a: string, b: string): number {
  if ('' + (+a) === a) {
    if ('' + (+b) !== b) {
      return -1;
    }
    return (+a < +b) ? -1 : 1;
  }
  return (a < b) ? -1 : 1;
}

var styles = {
  container: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    marginLeft: 10,
  },

  children: {
  },

  empty: {
    marginLeft: 10,
    padding: '2px 5px',
    color: '#aaa', // TODO (bvaughn) theme
  },

  missing: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 10,
    padding: '2px 5px',
    color: '#888', // TODO (bvaughn) theme
  },

  opener: {
    cursor: 'pointer',
    marginLeft: -8,
    paddingRight: 3,
    position: 'absolute',
    top: 4,
  },

  toggler: {
    left: -15,
    position: 'absolute',
    top: -1,
  },

  collapsedArrow: {
    borderColor: 'transparent transparent transparent rgb(110, 110, 110)', // TODO (bvaughn) theme
    borderStyle: 'solid',
    borderWidth: '4px 0 4px 7px',
    display: 'inline-block',
    marginLeft: 1,
    verticalAlign: 'top',
  },

  expandedArrow: {
    borderColor: 'rgb(110, 110, 110) transparent transparent transparent', // TODO (bvaughn) theme
    borderStyle: 'solid',
    borderWidth: '7px 4px 0 4px',
    display: 'inline-block',
    marginTop: 1,
    verticalAlign: 'top',
  },

  head: {
    display: 'flex',
    position: 'relative',
  },

  name: {
    color: '#666', // TODO (bvaughn) theme
    margin: '2px 3px',
  },

  sparseArrayFiller: {
    fontStyle: 'italic',
  },

  complexName: {
    cursor: 'pointer',
  },

  preview: {
    display: 'flex',
    margin: '2px 3px',
    whiteSpace: 'pre',
    wordBreak: 'break-word',
    flex: 1,
  },

  value: {
  },
};

module.exports = WrappedDataView;
