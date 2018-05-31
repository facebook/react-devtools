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

const PropTypes = require('prop-types');

var React = require('react');
var AutoSizeInput = require('./AutoSizeInput');

import type {Theme} from '../../frontend/types';

type Context = {
  theme: Theme,
};

type Props = {
  style: Object,
  onChange: (attr: string, val: string | number) => void,
  onRename: (oldName: string, newName: string, val: string | number) => void,
};

type DefaultProps = {};

type State = {
  showNew: boolean,
  newAttr: string,
  newValue: string|number,
};

class StyleEdit extends React.Component<Props, State> {
  context: Context;
  defaultProps: DefaultProps;

  constructor(props: Props) {
    super(props);
    this.state = {showNew: false, newAttr: '', newValue: ''};
  }

  onChange(name: string, val: string | number) {
    var num = Number(val);
    this.props.onChange(name, num === Number(val) ? num : val);
  }

  onNewSubmit(val: string | number) {
    this.onChange(this.state.newAttr, val);
    this.setState({showNew: false, newAttr: '', newValue: ''});
  }

  onNewAttr(attr: string | number) {
    if (attr === '') {
      this.setState({showNew: false});
    } else {
      this.setState({newAttr: '' + attr});
    }
  }

  onListClick(e: Event) {
    if (e.target instanceof Element) {
      if (e.target.tagName === 'INPUT') {
        return;
      }
    }
    this.setState({showNew: true});
  }

  render() {
    var attrs = Object.keys(this.props.style);
    return (
      <ul style={styles.list} onClick={e => this.onListClick(e)}>
        <span style={tagStyle(this.context.theme)}>style</span>
        <span>{' {'}</span>
        {attrs.map(name => (
          <li key={'style-' + name} style={styles.listItem} onClick={blockClick}>
            <AutoSizeInput
              type="attr"
              value={name}
              onChange={newName => this.props.onRename(name, '' + newName, this.props.style[name])}
            />
            <span style={styles.colon}>:</span>
            <AutoSizeInput
              value={this.props.style[name]}
              onChange={val => this.onChange(name, val)}
            />
            <span style={styles.colon}>;</span>
          </li>
        ))}
        {this.state.showNew &&
          <li style={styles.listItem}>
            <AutoSizeInput
              isNew={true}
              type="attr"
              value={this.state.newAttr}
              onChange={newAttr => this.onNewAttr(newAttr)}
            />
            <span style={styles.colon}>:</span>
            <AutoSizeInput
              value={''}
              onChange={val => this.onNewSubmit(val)}
            />
            <span style={styles.colon}>;</span>
          </li>}
        <span>{'}'}</span>
      </ul>
    );
  }
}

StyleEdit.contextTypes = {
  theme: PropTypes.object.isRequired,
};

const blockClick = event => event.stopPropagation();

const tagStyle = (theme: Theme) => ({
  color: theme.base04,
});

const styles = {
  list: {
    listStyle: 'none',
    padding: 0,
    margin: '5px 0px',
    cursor: 'text',
  },
  colon: {
    margin: '-3px',
  },
  listItem: {
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    cursor: 'default',
  },
};

module.exports = StyleEdit;
