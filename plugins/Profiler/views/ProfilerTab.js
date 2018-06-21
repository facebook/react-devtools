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

import type {Theme} from '../../../frontend/types';
import type {Snapshot} from '../ProfilerTypes';

import PropTypes from 'prop-types';
import React from 'react';
import decorate from '../../../frontend/decorate';
import {sansSerif} from '../../../frontend/Themes/Fonts';
import SvgIcon from '../../../frontend/SvgIcon';
import Icons from '../../../frontend/Icons';
import Hoverable from '../../../frontend/Hoverable';
import SnapshotsCollectionView from './SnapshotsCollectionView';

type Props = {|
  clearSnapshots: () => void,
  isRecording: boolean,
  snapshots: Array<Snapshot>,
  toggleIsRecording: (value: boolean) => void,
|};

class ProfilerTab extends React.Component<Props, void> {
  static contextTypes = {
    theme: PropTypes.object.isRequired,
  };

  render() {
    const { theme } = this.context;
    const { clearSnapshots, isRecording, snapshots, toggleIsRecording } = this.props;

    // TODO (bvaughn) Render button bar with record, reset, export, etc

    let content;
    if (isRecording) {
      content = (
        <RecordingInProgress theme={theme} stopRecording={toggleIsRecording} />
      );
    } else if (snapshots.length > 0) {
      content = (
        <SnapshotsCollectionView snapshots={snapshots} theme={theme} />
      );
    } else {
      content = (
        <InactiveNoData startRecording={toggleIsRecording} theme={theme} />
      );
    }

    return (
      <div style={styles.container}>
        <div style={settingsRowStyle(theme)}>
          <RecordButton
            isActive={isRecording}
            onClick={toggleIsRecording}
            theme={theme}
          />
          <RefreshButton theme={theme} />
          <ClearButton
            onClick={clearSnapshots}
            theme={theme}
          />
        </div>
        <div style={styles.content}>
          {content}
        </div>
      </div>
    );
  }
}

const InactiveNoData = ({startRecording, theme}) => (
  <span style={styles.row}>
    Click the record button <RecordButton
      isActive={false}
      onClick={startRecording}
      theme={theme}
    /> to start a new recording.
  </span>
);

const RecordingInProgress = ({stopRecording, theme}) => (
  <span style={styles.column}>
    Recording profiling data...
    <button
      onClick={stopRecording}
      style={stopRecordingButtonStyle(theme)}
      title="Stop recording"
    >
      Stop
    </button>
  </span>
);

const ClearButton = Hoverable(
  ({ isActive, isHovered, onClick, onMouseEnter, onMouseLeave, theme }) => (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={clearButtonStyle(isActive, isHovered, theme)}
      title="Clear profiling data"
    >
      <SvgIcon path={Icons.CLEAR} />
    </button>
  )
);

const RecordButton = Hoverable(
  ({ isActive, isHovered, onClick, onMouseEnter, onMouseLeave, theme }) => (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={recordButtonStyle(isActive, isHovered, theme)}
      title={isActive
        ? 'Stop recording'
        : 'Record profiling information'
      }
    >
      <SvgIcon path={Icons.RECORD} />
    </button>
  )
);

// TODO Make this interactive
const RefreshButton = ({ theme }) => (
  <button
    disabled={true}
    style={refreshButtonStyle(theme)}
    title="Start profiling and reload page"
  >
    <SvgIcon path={Icons.REFRESH} />
  </button>
);

var styles = {
  container: {
    flex: 1,
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'center',
    flexDirection: 'column',
    fontFamily: sansSerif.family,
    fontSize: sansSerif.sizes.normal,
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'auto',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

const clearButtonStyle = (isActive: boolean, isHovered: boolean, theme: Theme) => ({
  background: 'none',
  border: 'none',
  outline: 'none',
  cursor: 'pointer',
  color: isHovered ? theme.state06 : 'inherit',
  padding: '4px 8px',
});

const recordButtonStyle = (isActive: boolean, isHovered: boolean, theme: Theme) => ({
  background: 'none',
  border: 'none',
  outline: 'none',
  cursor: 'pointer',
  color: isActive
    ? theme.special03
    : isHovered ? theme.state06 : 'inherit',
  filter: isActive
    ? `drop-shadow( 0 0 2px ${theme.special03} )`
    : 'none',
  padding: '4px 8px',
});

const refreshButtonStyle = (theme: Theme) => ({
  background: 'none',
  border: 'none',
  outline: 'none',
  color: theme.base04,
  padding: '4px 8px',
});

const settingsRowStyle = (theme: Theme) => ({
  display: 'flex',
  flex: '0 0 auto',
  padding: '0.25rem',
  flexWrap: 'wrap',
  alignItems: 'center',
  position: 'relative',
  backgroundColor: theme.base01,
  borderBottom: `1px solid ${theme.base03}`,
});

const stopRecordingButtonStyle = (theme: Theme) => ({
  display: 'flex',
  background: theme.state00,
  border: 'none',
  outline: 'none',
  cursor: 'pointer',
  color: theme.base00,
  padding: '.5rem 0.75rem',
  marginTop: '0.5rem',
});

export default decorate({
  store: 'profilerStore',
  listeners: () => ['isRecording', 'snapshots'],
  props(store) {
    return {
      clearSnapshots: () => store.clearSnapshots(),
      isRecording: !!store.isRecording,
      snapshots: store.snapshots,
      toggleIsRecording: () => store.setIsRecording(!store.isRecording),
    };
  },
}, ProfilerTab);
