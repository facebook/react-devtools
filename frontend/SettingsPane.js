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
const PropTypes = require('prop-types');
const React = require('react');
const ReactDOM = require('react-dom');
const {sansSerif} = require('./Themes/Fonts');
const SearchUtils = require('./SearchUtils');
const SvgIcon = require('./SvgIcon');
const Icons = require('./Icons');
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
  showInspectButton: PropTypes.bool.isRequired,
  theme: PropTypes.object.isRequired,
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
      <SvgIcon path={Icons.INSPECT} />
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
      <SvgIcon path={Icons.SETTINGS} />
    </button>
  )
);

function SearchIcon({ theme }) {
  return (
    <SvgIcon
      style={searchIconStyle(theme)}
      path={Icons.SEARCH}
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
