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

const PropTypes = require('prop-types');

const React = require('react');

const LeftPane = require('./LeftPane');
const {sansSerif} = require('../../../frontend/Themes/Fonts');
const RightPane = require('./RightPane');
const SplitPane = require('../../../frontend/SplitPane');
const {serialize} = require('../../../frontend/Themes/Serializer');

import type {Theme} from '../../../frontend/types';

type Props = {
  theme: Theme,
  updateTheme: (Theme) => void,
};

class Application extends React.Component<Props> {
  _onInput: (event: Event) => void;

  constructor(props: Props, context: any) {
    super(props, context);

    this._onInput = this._onInput.bind(this);
  }

  getChildContext() {
    return {
      theme: this.props.theme,
    };
  }

  render() {
    const {theme} = this.props;

    return (
      <div style={applicationStyle(theme)}>
        <div style={staticStyles.header}>
          <strong
            contentEditable={true}
            dangerouslySetInnerHTML={{
              __html: theme.displayName,
            }}
            onInput={this._onInput}
          /> theme for <a href="https://github.com/facebook/react-devtools">React DevTools</a>
        </div>
        <div style={staticStyles.label}>
          Theme preview:
        </div>
        <div style={themeWrapper(theme)}>
          <SplitPane
            initialWidth={10}
            initialHeight={10}
            isVertical={false}
            left={() => <LeftPane />}
            right={() => <RightPane />}
          />
        </div>
        <div style={staticStyles.label}>
          Paste this text into React DevTools to import the theme:
        </div>
        <div style={staticStyles.themeText}>
          {serialize(theme)}
        </div>
      </div>
    );
  }

  _onInput(event: Event) {
    const {theme, updateTheme} = this.props;

    updateTheme({
      ...theme,
      displayName: (event.target: any).innerText,
    });
  }
}

Application.childContextTypes = {
  store: PropTypes.object,
  theme: PropTypes.object,
};
Application.propTypes = {
  theme: PropTypes.object,
  updateTheme: PropTypes.func,
};

const applicationStyle = (theme: Theme) => ({
  height: '100%',
  width: '600px',
  maxWidth: '100%',
  margin: '0 auto',
  fontFamily: sansSerif.family,
  fontSize: sansSerif.sizes.normal,
});

const themeWrapper = (theme: Theme) => ({
  borderRadius: '0.25rem',
  overflow: 'hidden',
  backgroundColor: theme.base00,
  color: theme.base05,
});

const staticStyles = {
  createdByRow: {
    margin: '0 0 0.25rem',
  },
  header: {
    marginTop: '1rem',
    marginBottom: '0.5rem',
    fontSize: sansSerif.sizes.large,
  },
  label: {
    marginTop: '1rem',
    marginBottom: '0.25rem',
  },
  themeText: {
    padding: '0.25rem',
    backgroundColor: '#ffe',
    border: '1px solid #ddd',
    borderRadius: '0.25rem',
    wordWrap: 'break-word',
  },
};

module.exports = Application;
