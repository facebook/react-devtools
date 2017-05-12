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
const {hexToRgba, isBright} = require('./Themes/utils');

import type {Base18Theme} from './types';

class PreferencesPanel extends React.Component {
  _selectRef: any;

  context: {
    theme: Base18Theme,
    themes: { [key: string]: Base18Theme },
  };
  props: {
    changeTheme: (themeName: string) => void,
    hide: () => void,
    open: bool,
  };

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
    const {theme, themes} = this.context;
    const {changeTheme, hide, open} = this.props;

    if (!open) {
      return null;
    }

    const themeKeys = Object.keys(themes)
      .filter(key => !key.includes('Chrome') && !key.includes('Firefox'));

    return (
      <div style={styles.backdrop} onClick={hide}>
        <div style={panelStyle(theme)} onClick={blockClick}>
          <h4 style={styles.header}>Theme</h4>
          <select
            onChange={changeTheme}
            onKeyUp={this._onKeyUp}
            ref={this._setSelectRef}
            value={theme.name}
          >
            <option value="">default</option>
            <option disabled="disabled">---</option>
            {themeKeys.map(key => (
              <option key={key} value={key}>{themes[key].name}</option>
            ))}
          </select>
          <ThemePreview theme={theme} />
          <button
            onClick={hide}
            style={styles.closeButton}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  _onKeyUp = ({ key }) => {
    if (key === 'Escape') {
      this.props.hide();
    }
  };

  _setSelectRef = (ref) => {
    this._selectRef = ref;
  };
}

PreferencesPanel.contextTypes = {
  theme: React.PropTypes.object.isRequired,
  themes: React.PropTypes.object.isRequired,
};
PreferencesPanel.propTypes = {
  changeTheme: React.PropTypes.func,
  hide: React.PropTypes.func,
  open: React.PropTypes.bool,
};

const ThemePreview = ({ theme }: { theme: Base18Theme }) => (
  <div style={styles.themePreview}>
    {Object.keys(theme)
      .filter(key => key !== 'name')
      .map(key => (
        <div
          key={key}
          style={themeSwatch(theme[key], theme)}
        >
          <div style={styles.themeSwatchLabel}>{key.replace('base', '')}</div>
          <div>{theme[key].replace('#', '')}</div>
        </div>
      ))}
  </div>
);

const blockClick = event => event.stopPropagation();

const WrappedPreferencesPanel = decorate({
  listeners() {
    return ['preferencesPanelShown'];
  },
  props(store, props) {
    return {
      changeTheme: event => store.changeTheme(event.target.value),
      hide: () => store.hidePreferencesPanel(),
      open: store.preferencesPanelShown,
    };
  },
}, PreferencesPanel);

const themeSwatch = (color: string, theme: Base18Theme) => ({
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.5rem',
  height: '2.5rem',
  borderRadius: '0.25rem',
  marginRight: '0.25rem',
  marginTop: '0.25rem',
  backgroundColor: color,
  color: isBright(color) ? '#000000' : '#ffffff',
  fontSize: sansSerif.sizes.small,
});

const panelStyle = (theme: Base18Theme) => ({
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
  border: `1px solid ${hexToRgba(theme.base05, 0.1)}`,
  color: theme.base05,
});

const styles = {
  backdrop: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0)',
  },
  header: {
    margin: '0 0 0.25rem',
  },
  closeButton: {
    marginTop: '0.5rem',
    padding: '0.25rem',
    borderRadius: '0.25rem',
  },
  themePreview: {
    display: 'inline-flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '22rem',
  },
  themeSwatchLabel: {
    fontSize: sansSerif.sizes.normal,
    marginBottom: '0.25rem',
  },
};

module.exports = WrappedPreferencesPanel;
