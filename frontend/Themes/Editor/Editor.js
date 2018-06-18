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

const {copy} = require('clipboard-js');
const decorate = require('../../decorate');
const PropTypes = require('prop-types');
const React = require('react');
const ColorInput = require('./ColorInput');
const ColorGroups = require('./ColorGroups');
const Hoverable = require('../../Hoverable');
const Icons = require('../../Icons');
const Input = require('../../Input');
const {monospace, sansSerif} = require('../Fonts');
const Preview = require('../Preview');
const SvgIcon = require('../../SvgIcon');
const Themes = require('../Themes');
const TimerSafe = require('../../TimerSafe');
const {deserialize, serialize} = require('../Serializer');
const {CUSTOM_THEME_NAME} = require('../constants');

import type {DOMEvent, Theme} from '../../types';
import type {SetTimeout} from '../../TimerSafe';

const THEME_SITE_URL = 'http://facebook.github.io/react-devtools/?theme=';

// The editor itself should use a known safe theme,
// In case a user messes up a custom theme and renders it unusable.
// The editor should remain usable in this case.
const safeTheme = Themes.ChromeDefault;

const colors = Object.assign({},
  ColorGroups.Base,
  ColorGroups.Selection,
  ColorGroups.Syntax
);

type Props = {
  changeTheme: (themeName: string) => void,
  defaultThemeName: string,
  hide: () => {},
  saveTheme: (theme: Theme) => {},
  setTimeout: SetTimeout,
  theme: Theme,
}

type State = {
  isResetEnabled: boolean,
  showCopyConfirmation: boolean,
  updateCounter: number,
}

class Editor extends React.Component<Props, State> {
  _customTheme: Theme;
  _serializedPropsTheme: string;

  constructor(props, context) {
    super(props, context);

    this.state = {
      isResetEnabled: false,
      showCopyConfirmation: false,
      updateCounter: 0,
    };

    this._serializedPropsTheme = serialize(props.theme);

    this._reset();
    this._sanitizeCustomTheme();
  }

  getChildContext() {
    return {
      theme: this._customTheme,
    };
  }

  render() {
    const {hide} = this.props;
    const {isResetEnabled, showCopyConfirmation, updateCounter} = this.state;

    return (
      <div
        onClick={event => event.stopPropagation()}
        style={editorStyle(safeTheme)}
      >
        <h3 style={styles.header}>Custom Theme</h3>

        <div style={styles.middleRow}>
          <div style={groupStyle(safeTheme)}>
            {Object.keys(colors).map(key => (
              <ColorInput
                descriptions={colors[key]}
                customTheme={this._customTheme}
                key={key}
                label={colors[key]}
                propertyName={key}
                udpatePreview={this._udpatePreview}
                theme={safeTheme}
              />
            ))}
          </div>
          <div style={previewWrapperStyle(this._customTheme)}>
            <Preview
              key={updateCounter}
              theme={this._customTheme}
            />
          </div>
        </div>

        <div style={styles.bottomRow}>
          <div style={styles.buttons}>
            <button onClick={hide}>
              Cancel
            </button> <button disabled={!isResetEnabled} onClick={this._reset}>
              Reset
            </button> <button onClick={this._save}>
              Save
            </button>
          </div>

          <div style={styles.importExportRow}>
            <CopyThemeButton
              onClick={this._copyTheme}
              showCopyConfirmation={showCopyConfirmation}
              title="Copy theme to clipboard"
              theme={safeTheme}
            />
            <SvgIcon path={Icons.SHARE} />
            <label style={styles.shareLabel}>Import/export:</label>
            <Input
              onChange={this._onShareChange}
              style={shareInput(safeTheme)}
              theme={safeTheme}
              type="text"
              value={serialize(this._customTheme)}
            />
          </div>
        </div>
      </div>
    );
  }

  _copyTheme = () => {
    const serializedTheme = encodeURI(serialize(this._customTheme));

    copy(THEME_SITE_URL + serializedTheme);

    // Give (temporary) UI confirmation that the URL has been copied.
    this.setState(
      {showCopyConfirmation: true},
      () => {
        this.props.setTimeout(
          () => this.setState({showCopyConfirmation: false}),
          2500,
        );
      },
    );
  };

  _onShareChange = (event: DOMEvent) => {
    this._customTheme = deserialize(event.target.value, this.props.theme);
    this._sanitizeCustomTheme();
    this._udpatePreview();
  };

  _udpatePreview = () => {
    this.setState(state => ({
      isResetEnabled: this._serializedPropsTheme !== serialize(this._customTheme),
      updateCounter: state.updateCounter + 1,
    }));
  };

  _reset = () => {
    this._customTheme = Object.assign({}, this.props.theme);
    this._udpatePreview();
  };

  _sanitizeCustomTheme() {
    this._customTheme.displayName = CUSTOM_THEME_NAME;

    delete this._customTheme.hidden;
  }

  _save = () => {
    const {changeTheme, hide, saveTheme} = this.props;

    saveTheme(this._customTheme);
    changeTheme(CUSTOM_THEME_NAME);
    hide();
  };
}

Editor.childContextTypes = {
  theme: PropTypes.object,
};

const WrappedEditor = decorate({
  listeners() {
    return [];
  },
  props(store, props) {
    return {
      changeTheme: themeName => store.changeTheme(themeName),
      defaultThemeName: store.themeStore.defaultThemeName,
      saveTheme: (theme: Theme) => store.saveCustomTheme(theme),
    };
  },
}, TimerSafe(Editor));

const CopyThemeButton = Hoverable(
  ({ isHovered, isPressed, onClick, onMouseDown, onMouseEnter, onMouseLeave, onMouseUp, showCopyConfirmation, theme }) => (
    <button
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseUp={onMouseUp}
      style={copyThemeButtonStyle(isHovered, isPressed, theme)}
      title="Copy theme to clipboard"
    >
      <SvgIcon path={showCopyConfirmation ? Icons.CHECK : Icons.COPY} />
      <label style={styles.copyLabel}>
        {showCopyConfirmation ? 'Copied' : 'Copy'}
      </label>
    </button>
  )
);

const editorStyle = (theme: Theme) => ({
  display: 'flex',
  flexDirection: 'column',
  maxWidth: 'calc(100vw - 2rem)',
  maxHeight: 'calc(100vh - 2rem)',
  boxSizing: 'border-box',
  zIndex: 1,
  padding: '0.5rem',
  borderRadius: '0.25rem',
  backgroundColor: theme.base01,
  color: theme.base05,
  border: `1px solid ${theme.base03}`,
  fontFamily: sansSerif.family,
  fontSize: sansSerif.sizes.normal,
});

const groupStyle = (theme: Theme) => ({
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  overflowY: 'auto',
  borderRadius: '0.25rem',
});

const previewWrapperStyle = (theme: Theme) => ({
  display: 'inline-flex',
  flex: '1 0 auto',
  marginLeft: '0.5rem',
  alignItems: 'stretch',
  borderRadius: '0.25rem',
  border: `1px solid ${theme.base03}`,
});

const shareInput = (theme: Theme) => ({
  flex: '0 1 15rem',
  padding: '0.25rem',
  border: `1px solid ${theme.base03}`,
  borderRadius: '0.25rem',
  fontFamily: monospace.family,
  fontSize: monospace.sizes.normal,
  color: 'inherit',
});

const copyThemeButtonStyle = (isHovered: boolean, isPressed: boolean, theme: Theme) => ({
  flex: '0 0 auto',
  display: 'flex',
  alignItems: 'center',
  padding: '0.25rem',
  margin: '0 0.25rem',
  height: '1.5rem',
  background: isPressed ? theme.state01 : 'none',
  border: 'none',
  color: isHovered ? theme.state06 : 'inherit',
});

const styles = {
  header: {
    flex: '0 0 auto',
    marginTop: 0,
    marginBottom: '0.5rem',
  },
  bottomRow: {
    flex: '0 0 auto',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '0.5rem',
  },
  buttons: {
    flex: '1 0 auto',
    marginTop: '0.5rem',
  },
  copyLabel: {
    flex: '0 0 auto',
    marginLeft: '0.25rem',
  },
  middleRow: {
    display: 'flex',
    flexDirection: 'row',
    flex: '0 1 auto',
    overflowY: 'auto',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
  },
  importExportRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flex: '0 0 auto',
    marginTop: '0.5rem',
  },
  shareLabel: {
    flex: '0 0 auto',
    margin: '0 0.25rem',
  },
};

module.exports = WrappedEditor;
