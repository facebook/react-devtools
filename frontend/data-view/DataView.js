/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @ xx flow $FlowFixMe
 * flow thinks that only subclasses of React.Component can be used as
 * ReactComponents.
 */
'use strict';

var React = require('react');
var Simple = require('./Simple');

var assign = require('object-assign');
var consts = require('../../backend/consts');
var previewComplex = require('./previewComplex');

class DataView {
  props: {
    data: Object,
    path: Array<string>,
    inspect: () => void,
    showMenu: () => void,
    readOnly: boolean,
  };

  render(): ReactElement {
    var data = this.props.data;
    if (!data) {
      return <div style={styles.missing}>null</div>;
    }
    var names = Object.keys(data);
    var path = this.props.path;
    if (!names.length) {
      return <span style={styles.empty}>Empty object</span>;
    }

    return (
      <ul style={styles.container}>
        {data[consts.proto] &&
          <DataItem
            name={'__proto__'}
            path={path.concat(['__proto__'])}
            key={'__proto__'}
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
  constructor(props) {
    super(props)
    this.state = {open: false, loading: false};
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.open && nextProps.value && nextProps.value[consts.inspected] === false) {
      this.inspect();
    }
  }

  inspect() {
    this.props.inspect(this.props.path, value => {
      assign(this.props.value, value);
      this.props.value[consts.inspected] = true;
      this.setState({loading: false});
    });
    this.setState({loading: true, open: true});
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
    if (otype === 'number' || otype === 'string' || data === null || data === undefined || otype === 'boolean') {
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
          {open ? <span>&#9660;</span> : <span>&#9654;</span>}
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
            style={styles.name}
          >
            {this.props.name}:
          </div>
          <div
            onContextMenu={e => this.props.showMenu(e, this.props.value, this.props.path, this.props.name)} 
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
    fontSize: 12,
    marginLeft: 20,
    padding: '2px 5px',
    color: '#aaa',
  },

  missing: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 20,
    padding: '2px 5px',
    color: '#888',
  },

  opener: {
    fontSize: 8,
    cursor: 'pointer',
    position: 'absolute',
    right: '100%',
    padding: '5px 0',
  },

  head: {
    display: 'flex',
    position: 'relative',
  },

  name: {
    color: '#666',
    margin: '2px 3px',
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
