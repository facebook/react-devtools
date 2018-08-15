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

import type {Theme, DOMEvent} from '../types';

const {sansSerif} = require('../Themes/Fonts');
const PropTypes = require('prop-types');
const React = require('react');
const Simple = require('./Simple');
const nullthrows = require('nullthrows').default;

const consts = require('../../agent/consts');
const previewComplex = require('./previewComplex');

type Inspect = (path: Array<string>, cb: () => void) => void;
type ShowMenu = boolean | (e: DOMEvent, val: any, path: Array<string>, name: string) => void;

type DataViewProps = {
  data: ?Object,
  path: Array<string>,
  inspect: Inspect,
  showMenu: ShowMenu,
  startOpen?: boolean,
  noSort?: boolean,
  readOnly?: boolean,
};

class DataView extends React.Component<DataViewProps> {
  context: {
    theme: Theme,
  };

  renderSparseArrayHole(count: number, key: string) {
    const {theme} = this.context;

    return (
      <li key={key}>
        <div style={styles.head}>
          <div style={sparseArrayHoleStyle(theme)}>
            undefined × {count}
          </div>
        </div>
      </li>
    );
  }

  renderItem(name: string, key: string) {
    const data = nullthrows(this.props.data);
    return (
      <DataItem
        key={key}
        name={name}
        path={this.props.path.concat([name])}
        startOpen={this.props.startOpen}
        inspect={this.props.inspect}
        showMenu={this.props.showMenu}
        readOnly={this.props.readOnly}
        value={data[name]} />
    );
  }

  render() {
    const {theme} = this.context;
    var data = this.props.data;
    if (!data) {
      return <div style={missingStyle(theme)}>null</div>;
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
        <div style={emptyStyle(theme)}>
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
            value={data[consts.proto]}
          />}

        {elements}
      </ul>
    );
  }
}

DataView.contextTypes = {
  theme: PropTypes.object.isRequired,
};

type Props = {
  path: Array<string>,
  inspect: Inspect,
  showMenu: ShowMenu,
  startOpen?: boolean,
  noSort?: boolean,
  readOnly?: boolean,
  name: string,
  value: any,
};

type State = {
  open: boolean,
  loading: boolean,
}

class DataItem extends React.Component<Props, State> {
  context: {
    onChange: (path: Array<string>, checked: boolean) => void,
    theme: Theme,
  };
  defaultProps: {};

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
    const {theme} = this.context;
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
            <span style={expandedArrowStyle(theme)} /> :
            <span style={collapsedArrowStyle(theme)} />}
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

    return (
      <li>
        <div style={styles.head}>
          {opener}
          <div
            style={nameStyle(complex, theme)}
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
            style={previewStyle(theme)}
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
  onChange: PropTypes.func,
  theme: PropTypes.object.isRequired,
};

function alphanumericSort(a: string, b: string): number {
  if ('' + (+a) === a) {
    if ('' + (+b) !== b) {
      return -1;
    }
    return (+a < +b) ? -1 : 1;
  }
  return (a < b) ? -1 : 1;
}

const nameStyle = (isComplex: boolean, theme: Theme) => ({
  cursor: isComplex ? 'pointer' : 'default',
  color: theme.special03,
  margin: '2px 3px',
});

const previewStyle = (theme: Theme) => ({
  display: 'flex',
  margin: '2px 3px',
  whiteSpace: 'pre',
  wordBreak: 'break-word',
  flex: 1,
  color: theme.special01,
});

const emptyStyle = (theme: Theme) => ({
  marginLeft: '0.75rem',
  padding: '0 5px',
  color: theme.base04,
  fontFamily: sansSerif.family,
  fontSize: sansSerif.sizes.normal,
  fontStyle: 'italic',
});

const missingStyle = (theme: Theme) => ({
  fontSize: sansSerif.sizes.normal,
  fontWeight: 'bold',
  marginLeft: '0.75rem',
  padding: '2px 5px',
  color: theme.base03,
});

const collapsedArrowStyle = (theme: Theme) => ({
  borderColor: `transparent transparent transparent ${theme.base03}`,
  borderStyle: 'solid',
  borderWidth: '4px 0 4px 7px',
  display: 'inline-block',
  marginLeft: 1,
  verticalAlign: 'top',
});

const expandedArrowStyle = (theme: Theme) => ({
  borderColor: `${theme.base03} transparent transparent transparent`,
  borderStyle: 'solid',
  borderWidth: '7px 4px 0 4px',
  display: 'inline-block',
  marginTop: 1,
  verticalAlign: 'top',
});

const sparseArrayHoleStyle = (theme: Theme) => ({
  fontStyle: 'italic',
  color: theme.base03,
  margin: '2px 3px',
});

var styles = {
  container: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    marginLeft: '0.75rem',
  },

  children: {
  },

  opener: {
    cursor: 'pointer',
    marginLeft: -10,
    paddingRight: 3,
    position: 'absolute',
    top: 4,
  },

  toggler: {
    left: -15,
    position: 'absolute',
    top: -1,
  },

  head: {
    display: 'flex',
    position: 'relative',
  },

  value: {
  },
};

module.exports = DataView;
