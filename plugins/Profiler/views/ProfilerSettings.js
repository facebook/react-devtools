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

import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import decorate from '../../../frontend/decorate';
import {sansSerif} from '../../../frontend/Themes/Fonts';

type Props = {|
  isSettingsPanelActive: boolean,
  showNativeNodes: boolean,
  toggleIsSettingsPanelActive: Function,
  toggleShowNativeNodes: Function,
|};

class ProfilerSettings extends PureComponent<Props, void> {
  static contextTypes = {
    theme: PropTypes.object.isRequired,
  };

  stopClickEventFromBubbling = event => event.stopPropagation();

  render() {
    const { theme } = this.context;
    const { isSettingsPanelActive, toggleShowNativeNodes, showNativeNodes } = this.props;

    if (!isSettingsPanelActive) {
      return null;
    }

    return (
      <div
        onClick={this.props.toggleIsSettingsPanelActive}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          onClick={this.stopClickEventFromBubbling}
          style={{
            fontFamily: sansSerif.family,
            backgroundColor: theme.base01,
            border: `1px solid ${theme.base03}`,
            color: theme.base05,
            borderRadius: '0.25rem',
            maxWidth: '100%',
            padding: '0.5rem',
            margin: '0.5rem',
          }}
        >
          <h4 style={{margin: '0 0 0.5rem'}}>
            Profiler settings
          </h4>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            title="Show native elements?"
          >
            <input
              type="checkbox"
              checked={showNativeNodes}
              onChange={toggleShowNativeNodes}
            /> Show native elements?
          </label>
        </div>
      </div>
    );
  }
}

export default decorate({
  store: 'profilerStore',
  listeners: () => [
    'isSettingsPanelActive',
    'showNativeNodes',
  ],
  props(store) {
    return {
      isSettingsPanelActive: store.isSettingsPanelActive,
      showNativeNodes: store.showNativeNodes,
      toggleIsSettingsPanelActive: () => store.setIsSettingsPanelActive(!store.isSettingsPanelActive),
      toggleShowNativeNodes: () => store.setShowNativeNodes(!store.showNativeNodes),
    };
  },
}, ProfilerSettings);
