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

import type {DOMEvent} from '../types';

var React = require('react');
var Simple = require('./Simple');

var assign = require('object-assign');
var consts = require('../../agent/consts');
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
};

class DataView extends React.Component {
  props: DataViewProps;

  render() {
    var data = this.props.data;
    if (!data) {
      return <div style={styles.missing}>null</div>;
    }
    var names = Object.keys(data);
    if (!this.props.noSort) {
      names.sort(alphanumericSort);
    }
    var path = this.props.path;
    if (!names.length) {
      return (
        <div style={styles.empty}>
          {Array.isArray(data) ? 'Empty array' : 'Empty object'}
        </div>
      );
    }

    return (
      <ul style={styles.container}>
        {data[consts.proto] &&
          <DataItem
            name={'__proto__'}
            path={path.concat(['__proto__'])}
            key={'__proto__'}
            startOpen={this.props.startOpen}
            inspect={this.props.inspect}
            showMenu={this.props.showMenu}
            readOnly={this.props.readOnly}
            value={this.props.data[consts.proto]}
          />}

        {names.map((name, i) => (
          <DataItem
            name={name}
            path={path.concat([name])}
            key={name}
            startOpen={this.props.startOpen}
            inspect={this.props.inspect}
            showMenu={this.props.showMenu}
            readOnly={this.props.readOnly}
            value={this.props.data[name]}
          />
        ))}
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

  render() {
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
      preview = previewComplex(data);
    }

    var open = this.state.open && (!data || data[consts.inspected] !== false);

    var opener = null;
    if (complex) {
      opener = (
        <div
          onClick={this.toggleOpen.bind(this)}
          style={styles.opener}>
          {open ?
            <span style={styles.expandedArrow} /> :
            <span style={styles.collapsedArrow} />}
        </div>
      );
    }

    var children = null;
    if (complex && open) {
      // TODO path
      children = (
        <div style={styles.children}>
          <DataView
            data={this.props.value}
            path={this.props.path}
            inspect={this.props.inspect}
            showMenu={this.props.showMenu}
            readOnly={this.props.readOnly}
          />
        </div>
      );
    }

    var name = this.props.name;
    if (name.length > 50) {
      name = name.slice(0, 50) + '…';
    }

    return (
      <li>
        <div style={styles.head}>
          {opener}
          <div
            style={assign({}, styles.name, complex && styles.complexName)}
            onClick={this.toggleOpen.bind(this)}
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
    color: '#aaa',
  },

  missing: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 10,
    padding: '2px 5px',
    color: '#888',
  },

  opener: {
    cursor: 'pointer',
    marginLeft: -8,
    paddingRight: 3,
    position: 'absolute',
    top: 4,
  },

  collapsedArrow: {
    borderColor: 'transparent transparent transparent rgb(110, 110, 110)',
    borderStyle: 'solid',
    borderWidth: '4px 0 4px 7px',
    display: 'inline-block',
    marginLeft: 1,
    verticalAlign: 'top',
  },

  expandedArrow: {
    borderColor: 'rgb(110, 110, 110) transparent transparent transparent',
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
    color: '#666',
    margin: '2px 3px',
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

module.exports = DataView;
