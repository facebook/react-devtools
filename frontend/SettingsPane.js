/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

var TraceUpdatesFrontendControl = require('../plugins/TraceUpdates/TraceUpdatesFrontendControl');
var ColorizerFrontendControl = require('../plugins/Colorizer/ColorizerFrontendControl');
var RegexFrontendControl = require('../plugins/Regex/RegexFrontendControl');
var React = require('react');
var ReactDOM = require('react-dom');
var {PropTypes} = React;

var decorate = require('./decorate');

class SettingsPane extends React.Component {

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
      // switch focus to tree view
      this.input.blur();
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
        <TraceUpdatesFrontendControl {...this.props} />
        <ColorizerFrontendControl {...this.props} />
        <RegexFrontendControl {...this.props} />
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

SettingsPane.propTypes = {
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
}, SettingsPane);


var styles = {
  container: {
    backgroundColor: '#efefef',
    padding: '4px 8px',
    borderBottom: '1px solid rgb(204, 204, 204)',
    display: 'flex',
    flexWrap: 'wrap',
    flexShrink: 0,
    alignItems: 'center',
    position: 'relative',
  },

  searchBox: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    position: 'relative',
  },

  cancelButton: {
    fontSize: '16px',
    padding: '0.5rem',
    position: 'absolute',
    cursor: 'pointer',
    right: 0,
    color: '#bbb',
  },

  input: {
    flex: 1,
    fontSize: '12px',
    padding: '4px',
    border: '1px solid #ccc',
    outline: 'none',
  },

  highlightedInput: {
    border: '1px solid #99c6f4',
    outline: '1px solid #81aedc',
  },
};

module.exports = Wrapped;
