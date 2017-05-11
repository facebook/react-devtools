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
var React = require('react');
var ReactDOM = require('react-dom');
var {sansSerif} = require('./Themes/Fonts');
var SearchUtils = require('./SearchUtils');
var {PropTypes} = React;

var decorate = require('./decorate');
var {hexToRgba} = require('./Themes/utils');

import type {Base16Theme} from './types';

type EventLike = {
  keyCode: number,
  target: Node,
  preventDefault: () => void,
  stopPropagation: () => void,
};

class SettingsPane extends React.Component {
  context: {
    theme: Base16Theme,
  };

  _key: (evt: EventLike) => void;

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
    var theme = this.context.theme;
    var searchText = this.props.searchText;

    var inputStyle;
    if (
      searchText &&
      SearchUtils.shouldSearchUseRegex(searchText) &&
      !SearchUtils.isValidRegex(searchText)
    ) {
      inputStyle = errorInputStyle(theme);
    } else if (searchText || this.state.focused) {
      inputStyle = highlightedInputStyle(theme);
    } else {
      inputStyle = baseInputStyle(theme);
    }

    return (
      <div style={settingsPaneStyle(theme)}>
        <SettingsMenuButton
          onClick={this.props.showPreferencesPanel}
          theme={theme}
        />

        <TraceUpdatesFrontendControl {...this.props} />
        
        <div style={styles.growToFill}>
          <ColorizerFrontendControl {...this.props} />
        </div>

        <div style={styles.searchInputWrapper}>
          <input
            style={inputStyle}
            ref={i => this.input = i}
            value={searchText}
            onFocus={() => this.setState({focused: true})}
            onBlur={() => this.setState({focused: false})}
            onKeyDown={e => this.onKeyDown(e.key)}
            placeholder={this.props.placeholderText}
            onChange={e => this.props.onChangeSearch(e.target.value)}
          />
          <SearchIcon theme={theme} />
          {!!searchText && (
            <div onClick={this.cancel.bind(this)} style={cancelButtonStyle(theme)}>
              &times;
            </div>
          )}
        </div>
      </div>
    );
  }
}

SettingsPane.contextTypes = {
  theme: React.PropTypes.object.isRequired,
};
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
      showPreferencesPanel() {
        store.showPreferencesPanel();
      },
    };
  },
}, SettingsPane);

const SettingsMenuButton = ({ onClick, theme }) => {
  return (
    <button onClick={onClick} style={settingsMenuButtonStyle(theme)}>
      <svg style={styles.settingsMenuIcon} viewBox="0 0 24 24">
        <path d="
          M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,
          1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,
          11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,
          5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,
          2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,
          4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,
          11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,
          15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,
          18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,
          18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,
          18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z
        "></path>
      </svg>
    </button>
  );
};

function SearchIcon({ theme }) {
  return (
    <svg
      style={searchIconStyle(theme)}
      version="1.1"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M31.008 27.231l-7.58-6.447c-0.784-0.705-1.622-1.029-2.299-0.998 1.789-2.096 2.87-4.815 2.87-7.787 0-6.627-5.373-12-12-12s-12 5.373-12 12 5.373 12 12 12c2.972 0 5.691-1.081 7.787-2.87-0.031 0.677 0.293 1.515 0.998 2.299l6.447 7.58c1.104 1.226 2.907 1.33 4.007 0.23s0.997-2.903-0.23-4.007zM12 20c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z"></path>
    </svg>
  );
}

const settingsPaneStyle = (theme: Base16Theme) => ({
  padding: '0.25rem',
  display: 'flex',
  flexWrap: 'wrap',
  flexShrink: 0,
  alignItems: 'center',
  position: 'relative',
  backgroundColor: theme.base01,
  borderBottom: `1px solid ${hexToRgba(theme.base05, 0.1)}`,
});

const settingsMenuButtonStyle = (theme: Base16Theme) => ({
  display: 'flex',
  cursor: 'pointer',
  borderRightStyle: 'solid',
  borderRightWidth: '1px',
  paddingRight: '0.5rem',
  background: 'none',
  border: 'none',
  color: 'inherit',
  borderRightColor: theme.base02,
});


const cancelButtonStyle = (theme: Base16Theme) => ({
  fontSize: sansSerif.sizes.large,
  padding: '0 0.5rem',
  position: 'absolute',
  cursor: 'pointer',
  right: 0,
  lineHeight: '28px',
  color: theme.base02,
});

const searchIconStyle = (theme: Base16Theme) => ({
  position: 'absolute',
  display: 'inline-block',
  pointerEvents: 'none',
  left: '0.25rem',
  top: 0,
  width: '1em',
  height: '100%',
  strokeWidth: 0,
  stroke: theme.base02,
  fill: theme.base02,
  lineHeight: '28px',
  fontSize: sansSerif.sizes.normal,
});

const baseInputStyle = (theme: Base16Theme) => ({
  fontSize: sansSerif.sizes.normal,
  padding: '0.25rem',
  border: `1px solid ${theme.base02}`,
  outline: 'none',
  borderRadius: '0.25rem',
  paddingLeft: '1.25rem',
  width: '150px',
});

const highlightedInputStyle = (theme: Base16Theme) => ({
  ...baseInputStyle(theme),
  border: `1px solid ${theme.base07}`,
  boxShadow: `0 0 1px 1px ${theme.base07}`,
});

const errorInputStyle = (theme: Base16Theme) => ({
  ...baseInputStyle(theme),
  backgroundColor: hexToRgba(theme.base0C, 0.1),
  border: `1px solid ${theme.base0C}`,
  boxShadow: `0 0 1px 1px ${theme.base0C}`,
});

var styles = {
  growToFill: {
    flexGrow: 1,
  },

  searchInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    position: 'relative',
  },

  settingsMenuIcon: {
    width: '16px',
    height: '16px',
    fill: 'currentColor',
  },
};

module.exports = Wrapped;
