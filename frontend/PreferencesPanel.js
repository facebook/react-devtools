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
const ReactDOM = require('react-dom');

const assign = require('object-assign');
const decorate = require('./decorate');
const Store = require('./Store');

import type {Base16Theme} from './theme';

class PreferencesPanel extends React.Component {
  props: {
    changeTheme: func,
    hide: func,
    open: bool,
    theme: Base16Theme,
    themes: { [string]: Base16Theme },
  };

  render() {
    const {changeTheme, hide, open, theme, themes} = this.props;

    if (!open) {
      return null;
    }

    const panelStyle = assign({}, styles.panel, {
      backgroundColor: theme.base07,
      color: theme.base04,
    });

    return (
      <div style={styles.backdrop} onClick={hide}>
        <div style={panelStyle} onClick={blockClick}>
          <h4 style={styles.header}>Theme</h4>
          <select onChange={changeTheme} value={theme.name}>
            {Object.keys(themes).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }
}

PreferencesPanel.propTypes = {
  changeTheme: React.PropTypes.func,
  hide: React.PropTypes.func,
  open: React.PropTypes.bool,
  theme: React.PropTypes.object,
  themes: React.PropTypes.object,
};

const blockClick = event => event.stopPropagation();

const WrappedPreferencesPanel = decorate({
  listeners() {
    return [
      'preferencesPanelShown',
      'theme',
    ];
  },
  props(store, props) {
    return {
      changeTheme: event => store.changeTheme(event.target.value),
      hide: () => store.hidePreferencesPanel(),
      open: store.preferencesPanelShown,
      theme: store.theme,
      themes: store.themes,
    };
  },
}, PreferencesPanel);

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
  panel: {
    width: '150px',
    maxWidth: '100%',
    margin: '0.5rem',
    padding: '0.5rem',
    borderRadius: '0.25rem',
  },
  header: {
    margin: '0 0 0.25rem',
  },
};

module.exports = WrappedPreferencesPanel;
