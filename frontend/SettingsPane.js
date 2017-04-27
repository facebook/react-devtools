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
        
        <div style={styles.growToFill}>
          <ColorizerFrontendControl {...this.props} />
        </div>

        <div style={styles.searchOptionsWrapper}>
          <RegexFrontendControl {...this.props} />
          <div style={styles.searchInputWrapper}>
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
            <div style={styles.placeholder}>
              <SearchIcon />
            </div>
            {!!this.props.searchText && (
              <div onClick={this.cancel.bind(this)} style={styles.cancelButton}>
                &times;
              </div>
            )}
          </div>
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

function SearchIcon() {
  return (
    <svg
      style={styles.searchIcon}
      version="1.1"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M31.008 27.231l-7.58-6.447c-0.784-0.705-1.622-1.029-2.299-0.998 1.789-2.096 2.87-4.815 2.87-7.787 0-6.627-5.373-12-12-12s-12 5.373-12 12 5.373 12 12 12c2.972 0 5.691-1.081 7.787-2.87-0.031 0.677 0.293 1.515 0.998 2.299l6.447 7.58c1.104 1.226 2.907 1.33 4.007 0.23s0.997-2.903-0.23-4.007zM12 20c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z"></path>
    </svg>
  );
}

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

  growToFill: {
    flexGrow: 1,
  },

  searchOptionsWrapper: {
    display: 'flex',
    alignItems: 'center',
  },

  searchInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    position: 'relative',
  },

  placeholder: {
    position: 'absolute',
    cursor: 'pointer',
    left: '0.25rem',
    right: '0.25rem',
    color: '#bbb',
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    whiteSpace: 'pre',
    overflow: 'hidden',
    pointerEvents: 'none',
  },

  cancelButton: {
    fontSize: '16px',
    padding: '0.5rem',
    position: 'absolute',
    cursor: 'pointer',
    right: 0,
    color: '#bbb',
  },

  searchIcon: {
    display: 'inline-block',
    width: '1em',
    height: '1em',
    strokeWidth: 0,
    stroke: 'currentColor',
    fill: 'currentColor',
  },

  input: {
    flex: 1,
    fontSize: '12px',
    padding: '4px',
    border: '1px solid #ccc',
    outline: 'none',
    borderRadius: '4px',
    paddingLeft: '1.25rem',
  },

  highlightedInput: {
    border: '1px solid #99c6f4',
    boxShadow: '0 0 1px 1px #81aedc',
  },
};

module.exports = Wrapped;
