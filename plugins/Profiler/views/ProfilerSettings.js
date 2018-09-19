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
  commitThreshold: number,
  isSettingsPanelActive: boolean,
  hideCommitsBelowThreshold: boolean,
  setCommitThrehsold: (value: number) => void,
  showNativeNodes: boolean,
  toggleHideCommitsBelowThreshold: Function,
  toggleIsSettingsPanelActive: Function,
  toggleShowNativeNodes: Function,
|};

class ProfilerSettings extends PureComponent<Props, void> {
  static contextTypes = {
    theme: PropTypes.object.isRequired,
  };

  handleCommitThresholdChange = event => {
    const { hideCommitsBelowThreshold, setCommitThrehsold, toggleHideCommitsBelowThreshold } = this.props;

    const commitThreshold = parseFloat(event.currentTarget.value);
    if (!Number.isNaN(commitThreshold)) {
      setCommitThrehsold(commitThreshold);

      // For convenience, enable the hide-commits feature if the threshold is being changed.
      // This seems likely to be what the user wants.
      if (!hideCommitsBelowThreshold) {
        toggleHideCommitsBelowThreshold();
      }
    }
  };

  stopClickEventFromBubbling = event => event.stopPropagation();

  render() {
    const { theme } = this.context;
    const {
      commitThreshold,
      hideCommitsBelowThreshold,
      isSettingsPanelActive,
      toggleHideCommitsBelowThreshold,
      toggleIsSettingsPanelActive,
      toggleShowNativeNodes,
      showNativeNodes,
    } = this.props;

    if (!isSettingsPanelActive) {
      return null;
    }

    return (
      <div
        onClick={toggleIsSettingsPanelActive}
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
            minWidth: '250px',
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
              marginBottom: '0.25rem',
            }}
            title="Show native elements"
          >
            <input
              type="checkbox"
              checked={showNativeNodes}
              onChange={toggleShowNativeNodes}
            /> Show native elements
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            title="Hide commits below threshold"
          >
            <input
              type="checkbox"
              checked={hideCommitsBelowThreshold}
              onChange={toggleHideCommitsBelowThreshold}
            /> Hide commits below <input
              type="number"
              style={{
                width: '3rem',
              }}
              defaultValue={commitThreshold}
              min={1}
              onChange={this.handleCommitThresholdChange}
            /> ms
          </label>
        </div>
      </div>
    );
  }
}

export default decorate({
  store: 'profilerStore',
  listeners: () => [
    'commitThreshold',
    'hideCommitsBelowThreshold',
    'isSettingsPanelActive',
    'showNativeNodes',
  ],
  props(store) {
    return {
      commitThreshold: store.commitThreshold,
      hideCommitsBelowThreshold: store.hideCommitsBelowThreshold,
      isSettingsPanelActive: store.isSettingsPanelActive,
      showNativeNodes: store.showNativeNodes,
      setCommitThrehsold: store.setCommitThrehsold,
      toggleHideCommitsBelowThreshold: () => store.setHideCommitsBelowThreshold(!store.hideCommitsBelowThreshold),
      toggleIsSettingsPanelActive: () => store.setIsSettingsPanelActive(!store.isSettingsPanelActive),
      toggleShowNativeNodes: () => store.setShowNativeNodes(!store.showNativeNodes),
    };
  },
}, ProfilerSettings);
