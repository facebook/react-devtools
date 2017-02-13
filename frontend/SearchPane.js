/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * $FLowFixMe
 * - thinks all react component classes must inherit from React.Component
 */
'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var SettingsPane = require('./SettingsPane');
var TreeView = require('./TreeView');
var {PropTypes} = React;

var decorate = require('./decorate');

type EventLike = {
  keyCode: number,
  target: Node,
  preventDefault: () => void,
  stopPropagation: () => void,
};

type State = {
  focused: boolean,
};

class SearchPane extends React.Component {
  input: ?HTMLElement;
  _key: (evt: EventLike) => void;
  state: State;

  constructor(props) {
    super(props);
    this.state = {focused: false};
  }

  componentDidMount() {
    this._key = this.onDocumentKeyDown.bind(this);
    var doc = ReactDOM.findDOMNode(this).ownerDocument;
    // capture=true is needed to prevent chrome devtools console popping up
    doc.addEventListener('keydown', this._key, true);
  }

  componentWillUnmount() {
    var doc = ReactDOM.findDOMNode(this).ownerDocument;
    doc.removeEventListener('keydown', this._key, true);
  }

  onDocumentKeyDown(e) {
    if (
      e.keyCode === 191 && // forward slash
      e.target.nodeName !== 'INPUT' &&
      !e.target.isContentEditable &&
      this.input
    ) {
      this.input.focus();
      e.preventDefault();
    }
    if (e.keyCode === 27) { // escape
      if (!this.props.searchText && !this.state.focused) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      this.cancel();
    }
  }

  cancel() {
    this.props.onChangeSearch('');
    if (this.input) {
      this.input.blur();
    }
  }

  onKeyDown(key) {
    if (key === 'Enter' && this.input) {
      this.props.selectFirstSearchResult();
    }
  }

  render() {
    var inputStyle = styles.input;
    if (this.props.searchText || this.state.focused) {
      inputStyle = {...inputStyle, ...styles.highlightedInput};
    }
    return (
      <div style={styles.container}>
        <SettingsPane />
        <TreeView reload={this.props.reload} />
        <div style={styles.searchBox}>
          <input
            style={inputStyle}
            ref={i => this.input = i}
            value={this.props.searchText}
            onFocus={() => this.setState({focused: true})}
            onBlur={() => this.setState({focused: false})}
            onKeyDown={e => this.onKeyDown(e.key)}
            placeholder={this.props.placeholderText}
            onChange={e => this.props.onChangeSearch(e.target.value)}
          />
          {!!this.props.searchText && <div onClick={this.cancel.bind(this)} style={styles.cancelButton}>
            &times;
          </div>}
        </div>
      </div>
    );
  }
}

SearchPane.propTypes = {
  reload: PropTypes.func,
  searchText: PropTypes.string,
  selectFirstSearchResult: PropTypes.func,
  onChangeSearch: PropTypes.func,
  placeholderText: PropTypes.string,
};

var Wrapped = decorate({
  listeners(props) {
    return ['searchText', 'placeholderchange'];
  },
  props(store) {
    return {
      onChangeSearch: text => store.changeSearch(text),
      placeholderText: store.placeholderText,
      searchText: store.searchText,
      selectFirstSearchResult: store.selectFirstSearchResult.bind(store),
    };
  },
}, SearchPane);

var styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },

  searchBox: {
    display: 'flex',
    flexShrink: 0,
    position: 'relative',
  },

  cancelButton: {
    fontSize: '13px',
    padding: '0 4px',
    borderRadius: '10px',
    height: '17px',
    position: 'absolute',
    cursor: 'pointer',
    right: '7px',
    top: '8px',
    color: 'white',
    backgroundColor: 'rgb(255, 137, 137)',
  },

  input: {
    flex: 1,
    fontSize: '18px',
    padding: '5px 10px',
    border: 'none',
    transition: 'border-top-color .2s ease, background-color .2s ease',
    borderTop: '1px solid #ccc',
    borderTopColor: '#ccc',
    outline: 'none',
  },

  highlightedInput: {
    borderTopColor: 'aqua',
    backgroundColor: '#EEFFFE',
  },
};

module.exports = Wrapped;
