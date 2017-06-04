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

const TraceUpdatesFrontendControl = require('../plugins/TraceUpdates/TraceUpdatesFrontendControl');
const ColorizerFrontendControl = require('../plugins/Colorizer/ColorizerFrontendControl');
const React = require('react');
const ReactDOM = require('react-dom');
const {sansSerif} = require('./Themes/Fonts');
const SearchUtils = require('./SearchUtils');
const SvgIcon = require('./SvgIcon');
const {PropTypes} = React;
const Input = require('./Input');
const Hoverable = require('./Hoverable');

const decorate = require('./decorate');
const {hexToRgba} = require('./Themes/utils');

import type {Theme} from './types';

type EventLike = {
  keyCode: number,
  target: Node,
  preventDefault: () => void,
  stopPropagation: () => void,
};

class SettingsPane extends React.Component {
  context: {
    theme: Theme,
  };

  _key: (evt: EventLike) => void;

  constructor(props) {
    super(props);
    this.state = {focused: false};
  }

  componentDidMount() {
    this._key = this.onDocumentKeyDown.bind(this);
    const doc = ReactDOM.findDOMNode(this).ownerDocument;
    // capture=true is needed to prevent chrome devtools console popping up
    doc.addEventListener('keydown', this._key, true);
  }

  componentWillUnmount() {
    const doc = ReactDOM.findDOMNode(this).ownerDocument;
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
        {this.context.showInspectButton && (
          <InspectMenuButton
            isInspectEnabled={this.props.isInspectEnabled}
            onClick={this.props.toggleInspectEnabled}
            theme={theme}
          />
        )}

        <SettingsMenuButton
          onClick={this.props.showPreferencesPanel}
          theme={theme}
        />

        <TraceUpdatesFrontendControl {...this.props} />

        <div style={styles.growToFill}>
          <ColorizerFrontendControl {...this.props} />
        </div>

        <div style={styles.searchInputWrapper}>
          <Input
            style={inputStyle}
            innerRef={i => this.input = i}
            value={searchText}
            onFocus={() => this.setState({focused: true})}
            onBlur={() => this.setState({focused: false})}
            onKeyDown={e => this.onKeyDown(e.key)}
            placeholder="Search (text or /regex/)"
            onChange={e => this.props.onChangeSearch(e.target.value)}
            title="Search by React component name or text"
          />
          <SearchIcon theme={theme} />
          {!!searchText && (
            <ClearSearchButton
              onClick={this.cancel.bind(this)}
              theme={theme}
            />
          )}
        </div>
      </div>
    );
  }
}

SettingsPane.contextTypes = {
  showInspectButton: React.PropTypes.bool.isRequired,
  theme: React.PropTypes.object.isRequired,
};
SettingsPane.propTypes = {
  searchText: PropTypes.string,
  selectFirstSearchResult: PropTypes.func,
  onChangeSearch: PropTypes.func,
};

var Wrapped = decorate({
  listeners(props) {
    return ['isInspectEnabled', 'searchText'];
  },
  props(store) {
    return {
      isInspectEnabled: store.isInspectEnabled,
      onChangeSearch: text => store.changeSearch(text),
      searchText: store.searchText,
      selectFirstSearchResult: store.selectFirstSearchResult.bind(store),
      showPreferencesPanel() {
        store.showPreferencesPanel();
      },
      toggleInspectEnabled: () => store.setInspectEnabled(!store.isInspectEnabled),
    };
  },
}, SettingsPane);

const ClearSearchButton = Hoverable(
  ({ isHovered, onClick, onMouseEnter, onMouseLeave, theme }) => (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={clearSearchButtonStyle(isHovered, theme)}
    >
      &times;
    </div>
  )
);

const InspectMenuButton = Hoverable(
  ({ isHovered, isInspectEnabled, onClick, onMouseEnter, onMouseLeave, theme }) => (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={inspectMenuButtonStyle(isInspectEnabled, isHovered, theme)}
      title="Select a React element in the page to inspect it"
    >
      <SvgIcon path="
        M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M3.05,
        13H1V11H3.05C3.5,6.83 6.83,3.5 11,3.05V1H13V3.05C17.17,3.5 20.5,6.83 20.95,
        11H23V13H20.95C20.5,17.17 17.17,20.5 13,20.95V23H11V20.95C6.83,20.5 3.5,17.17 3.05,
        13M12,5A7,7 0 0,0 5,12A7,7 0 0,0 12,19A7,7 0 0,0 19,12A7,7 0 0,0 12,5Z
      "/>
    </button>
  )
);

const SettingsMenuButton = Hoverable(
  ({ isHovered, onClick, onMouseEnter, onMouseLeave, theme }) => (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={settingsMenuButtonStyle(isHovered, theme)}
      title="Customize React DevTools"
    >
      <SvgIcon path="
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
      "/>
    </button>
  )
);

function SearchIcon({ theme }) {
  return (
    <SvgIcon
      style={searchIconStyle(theme)}
      path="M31.008 27.231l-7.58-6.447c-0.784-0.705-1.622-1.029-2.299-0.998 1.789-2.096 2.87-4.815 2.87-7.787 0-6.627-5.373-12-12-12s-12 5.373-12 12 5.373 12 12 12c2.972 0 5.691-1.081 7.787-2.87-0.031 0.677 0.293 1.515 0.998 2.299l6.447 7.58c1.104 1.226 2.907 1.33 4.007 0.23s0.997-2.903-0.23-4.007zM12 20c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z"
    />
  );
}

const settingsPaneStyle = (theme: Theme) => ({
  padding: '0.25rem',
  display: 'flex',
  flexWrap: 'wrap',
  flexShrink: 0,
  alignItems: 'center',
  position: 'relative',
  backgroundColor: theme.base01,
  borderBottom: `1px solid ${theme.base03}`,
});

const clearSearchButtonStyle = (isHovered: boolean, theme: Theme) => ({
  fontSize: sansSerif.sizes.large,
  padding: '0 0.5rem',
  position: 'absolute',
  cursor: 'default',
  right: 0,
  lineHeight: '28px',
  color: isHovered ? theme.base04 : theme.base02,
});

const inspectMenuButtonStyle = (isInspectEnabled: boolean, isHovered: boolean, theme: Theme) => {
  let color;
  if (isInspectEnabled) {
    color = theme.state00;
  } else if (isHovered) {
    color = theme.state06;
  } else {
    color = 'inherit';
  }

  return {
    display: 'flex',
    background: 'none',
    border: 'none',
    outline: 'none', // Use custom active highlight instead
    color,
  };
};

const searchIconStyle = (theme: Theme) => ({
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

const settingsMenuButtonStyle = (isHovered: boolean, theme: Theme) => ({
  display: 'flex',
  background: 'none',
  border: 'none',
  marginRight: '0.5rem',
  color: isHovered ? theme.state06 : 'inherit',
});

const baseInputStyle = (theme: Theme) => ({
  fontSize: sansSerif.sizes.normal,
  padding: '0.25rem',
  border: `1px solid ${theme.base02}`,
  outline: 'none',
  borderRadius: '0.25rem',
  paddingLeft: '1.25rem',
  width: '150px',
});

const highlightedInputStyle = (theme: Theme) => ({
  ...baseInputStyle(theme),
  border: `1px solid ${hexToRgba(theme.state00, 0.75)}`,
});

const errorInputStyle = (theme: Theme) => ({
  ...baseInputStyle(theme),
  backgroundColor: hexToRgba(theme.special03, 0.1),
  border: `1px solid ${theme.special03}`,
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
};

module.exports = Wrapped;
