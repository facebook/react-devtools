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

const React = require('react');

const decorate = require('./decorate');
const {sansSerif} = require('./Themes/Fonts');
const Preview = require('./Themes/Preview');

import type {Theme} from './types';

class PreferencesPanel extends React.Component {
  _selectRef: any;

  context: {
    defaultThemeName: string,
    showHiddenThemes: boolean,
    theme: Theme,
    themeName: string,
    themes: { [key: string]: Theme },
  };
  props: {
    changeTheme: (themeName: string) => void,
    hide: () => void,
    open: bool,
  };
  state: {
    previewMode: bool,
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      previewMode: false,
    };
  }

  componentDidMount(prevProps, prevState) {
    if (this.props.open) {
      this._selectRef.focus();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.open && !prevProps.open) {
      this._selectRef.focus();
    }
  }

  render() {
    const {defaultThemeName, showHiddenThemes, theme, themeName, themes} = this.context;
    const {hide, open} = this.props;
    const {previewMode} = this.state;

    if (!open) {
      return null;
    }

    let content;
    if (previewMode) {
      content = (
        <Preview theme={theme} />
      );
    } else {
      let themeNames = Object.keys(themes);
      if (!showHiddenThemes) {
        themeNames = themeNames.filter(key => !themes[key].hidden);
      }

      content = (
        <div style={panelStyle(theme)} onClick={blockClick}>
          <h4 style={styles.header}>Theme</h4>
          <div style={styles.selectAndPreviewRow}>
            <select
              onChange={this._changeTheme}
              onKeyUp={this._onKeyUp}
              ref={this._setSelectRef}
              value={themeName}
            >
              {!showHiddenThemes && (<option value="">Match browser</option>)}
              {!showHiddenThemes && (<option disabled="disabled">---</option>)}
              {themeNames.map(key => (
                <option key={key} value={key}>{themes[key].displayName}</option>
              ))}
            </select>
            <button
              onClick={this._onPreviewClick}
              style={styles.previewButton}
            >
              <PreviewIcon />
            </button>
          </div>
          <div style={styles.buttonBar}>
            <button
              disabled={themeName === defaultThemeName}
              onClick={this._reset}
              style={styles.button}
            >
              Reset
            </button>
            <button
              onClick={hide}
              style={styles.button}
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.backdrop} onClick={this._hide}>
        {content}
      </div>
    );
  }

  _changeTheme = (event) => {
    const {showHiddenThemes, themes} = this.context;
    const {changeTheme} = this.props;

    const themeName = event.target.value;
    const theme = themes[themeName];

    if (!themeName || !theme || (theme.hidden && !showHiddenThemes)) {
      changeTheme('');
    } else {
      changeTheme(themeName);
    }
  };

  _hide = () => {
    const {hide} = this.props;
    const {previewMode} = this.state;

    if (previewMode) {
      this.setState({
        previewMode: false,
      });
    } else {
      hide();
    }
  };

  _reset = () => {
    const {changeTheme} = this.props;
    changeTheme('');
  };

  _onKeyUp = ({ key }) => {
    if (key === 'Escape') {
      this.props.hide();
    }
  };

  _onPreviewClick = () => {
    this.setState(state => ({
      previewMode: !state.previewMode,
    }));
  };

  _setSelectRef = (ref) => {
    this._selectRef = ref;
  };
}

PreferencesPanel.contextTypes = {
  defaultThemeName: React.PropTypes.string.isRequired,
  showHiddenThemes: React.PropTypes.bool.isRequired,
  theme: React.PropTypes.object.isRequired,
  themeName: React.PropTypes.string.isRequired,
  themes: React.PropTypes.object.isRequired,
};
PreferencesPanel.propTypes = {
  changeTheme: React.PropTypes.func,
  hide: React.PropTypes.func,
  open: React.PropTypes.bool,
};

const PreviewIcon = () => (
  <svg
    style={styles.previewIcon}
    viewBox="0 0 24 24"
  >
    <path d="
      M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,
      1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,
      12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z
    " />
  </svg>
);

const blockClick = event => event.stopPropagation();

const WrappedPreferencesPanel = decorate({
  listeners() {
    return ['preferencesPanelShown'];
  },
  props(store, props) {
    return {
      changeTheme: themeName => store.changeTheme(themeName),
      hide: () => store.hidePreferencesPanel(),
      open: store.preferencesPanelShown,
    };
  },
}, PreferencesPanel);

const panelStyle = (theme: Theme) => ({
  maxWidth: '100%',
  margin: '0.5rem',
  padding: '0.5rem',
  borderRadius: '0.25rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  zIndex: 1,
  fontFamily: sansSerif.family,
  backgroundColor: theme.base01,
  border: `1px solid ${theme.base03}`,
  color: theme.base05,
});

const styles = {
  backdrop: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0)',
  },
  header: {
    margin: '0 0 0.25rem',
  },
  buttonBar: {
    flexDirection: 'row',
  },
  button: {
    marginTop: '0.5rem',
    marginRight: '0.25rem',
    padding: '0.25rem',
  },
  selectAndPreviewRow: {
    display: 'flex',
    direction: 'row',
    alignItems: 'center',
  },
  previewButton: {
    marginLeft: '0.25rem',
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
  },
  previewIcon: {
    fill: 'currentColor',
    width: '1rem',
    height: '1rem',
  },
};

module.exports = WrappedPreferencesPanel;
