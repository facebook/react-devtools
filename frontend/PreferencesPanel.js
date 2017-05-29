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
const {CUSTOM_THEME_NAME} = require('./Themes/constants');
const SvgIcon = require('./SvgIcon');
const ThemeEditor = require('./Themes/Editor/Editor');

import type {Theme} from './types';

class PreferencesPanel extends React.Component {
  _selectRef: any;

  context: {
    browserName: string,
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
    editMode: bool,
    previewMode: bool,
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      editMode: false,
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
    const {browserName, showHiddenThemes, theme, themeName, themes} = this.context;
    const {hide, open} = this.props;
    const {editMode, previewMode} = this.state;

    if (!open) {
      return null;
    }

    let content;
    if (editMode) {
      content = (
        <ThemeEditor hide={this._hide} theme={theme} />
      );
    } else if (previewMode) {
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
              {!showHiddenThemes && (<option value="">{browserName}</option>)}
              <option value={CUSTOM_THEME_NAME}>Custom</option>
              <option disabled="disabled">---</option>
              {themeNames.map(key => (
                <option key={key} value={key}>{themes[key].displayName}</option>
              ))}
            </select>
            {themeName !== CUSTOM_THEME_NAME && (
              <button
                onClick={this._onPreviewClick}
                style={styles.iconButton}
              >
                <PreviewIcon />
              </button>
            )}
            {themeName === CUSTOM_THEME_NAME && (
              <button
                onClick={this._onEditCustomThemeClick}
                style={styles.iconButton}
              >
                <EditIcon />
              </button>
            )}
          </div>
          <div style={styles.buttonBar}>
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
    const {changeTheme} = this.props;

    changeTheme(event.target.value);
  };

  _hide = () => {
    const {hide} = this.props;
    const {editMode, previewMode} = this.state;

    if (previewMode) {
      this.setState({
        previewMode: false,
      });
    } else if (editMode) {
      this.setState({
        editMode: false,
      });
    } else {
      hide();
    }
  };

  _onEditCustomThemeClick = () => {
    this.setState({
      editMode: true,
    });
  };

  _onKeyUp = ({ key }) => {
    if (key === 'Escape') {
      this.props.hide();
    }
  };

  _onPreviewClick = () => {
    this.setState({
      previewMode: true,
    });
  };

  _setSelectRef = (ref) => {
    this._selectRef = ref;
  };
}

PreferencesPanel.contextTypes = {
  browserName: React.PropTypes.string.isRequired,
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
  <SvgIcon path="
    M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,
    1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,
    12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z
  " />
);

const EditIcon = () => (
  <SvgIcon path="
    M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,
    5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z
  "/>
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
  iconButton: {
    padding: '0.25rem',
    marginLeft: '0.25rem',
    height: '1.5rem',
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
  },
};

module.exports = WrappedPreferencesPanel;
