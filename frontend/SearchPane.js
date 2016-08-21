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
var { PropTypes } = React;

var ColorizerFrontendControl = require('../plugins/Colorizer/ColorizerFrontendControl');
var RegexFrontendControl = require('../plugins/Regex/RegexFrontendControl');

var decorate = require('./decorate');

type EventLike = {
  keyCode: number,
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
    this.state = { focused: false };
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
    if (e.keyCode === 191) { // forward slash
      var doc = ReactDOM.findDOMNode(this).ownerDocument;
      if (!this.input || doc.activeElement === this.input) {
        return;
      }
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
      inputStyle = { ...inputStyle, ...styles.highlightedInput };
    }
    return (
      <div style={styles.container}>
        <SettingsPane />
        <div style={styles.searchBox}>
          <div style={styles.searchInputBox}>
            <input
              style={inputStyle}
              ref={i => this.input = i}
              value={this.props.searchText}
              onFocus={() => this.setState({ focused: true })}
              onBlur={() => this.setState({ focused: false })}
              onKeyDown={e => this.onKeyDown(e.key)}
              placeholder={this.props.placeholderText}
              onChange={e => this.props.onChangeSearch(e.target.value)}
            />
            {!!this.props.searchText && <div onClick={this.cancel.bind(this)} style={styles.cancelButton}>
              &times;
            </div>}
          </div>
          <div style={styles.searchControls}>
            <RegexFrontendControl />
            <ColorizerFrontendControl />
          </div>
        </div>
        <TreeView reload={this.props.reload} />
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

  searchInputBox: {
    position: 'relative',
    display: 'inline-block',
  },

  searchBox: {
    background: '#f3f3f3',
    borderBottom: '1px solid #dadada',
    padding: '4px',
  },

  searchControls: {
    display: 'inline-block',
  },

  cancelButton: {
    fontSize: '11px',
    lineHeight: '11px',
    borderRadius: '50%',
    position: 'absolute',
    cursor: 'default',
    height: '12px',
    width: '12px',
    right: '4px',
    bottom: 0,
    top: 0,
    margin: 'auto',
    color: 'white',
    backgroundColor: '#949494',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },

  input: {
    fontSize: '12px',
    transition: 'border-top-color .2s ease, background-color .2s ease',
    border: '1px solid #a3a3a3',
    outline: 'none',
    padding: '1px 3px 0',
    margin: '0 0 0 1px',
    borderRadius: '2px',
    lineHeight: '1.5',
    width: '200px',
  },
};

module.exports = Wrapped;
