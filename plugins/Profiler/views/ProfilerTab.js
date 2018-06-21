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
import React, { Fragment } from 'react';
import decorate from '../../../frontend/decorate';
import {monospace, sansSerif} from '../../../frontend/Themes/Fonts';
import SvgIcon from '../../../frontend/SvgIcon';
import Icons from '../../../frontend/Icons';
import Hoverable from '../../../frontend/Hoverable';
import FiberRenderDurations from './FiberRenderDurations';
import SnapshotFlamegraph from './SnapshotFlamegraph';
import RankedSnapshot from './RankedSnapshot';

type Chart = 'flamegraph' | 'ranked';

type Props = {|
  isRecording: boolean,
  snapshots: Array<Snapshot>,
  toggleIsRecording: (value: boolean) => void,
|};

type State = {|
  inspectSelectedFiber: boolean,
  selectedChart: Chart,
  selectedFiber: Object | null,
  snapshotIndex: number,
|};

class ProfilerTab extends React.Component<Props, State> {
  static contextTypes = {
    theme: PropTypes.object.isRequired,
  };

  state: State = {
    inspectSelectedFiber: false,
    selectedChart: 'flamegraph',
    selectedFiber: null,
    snapshotIndex: 0,
  };

  // TODO Reset e.g. selectedFiber when snapshotIndex changes (if fiber not in snapshot)

  handleSnapshotSliderChange = (event: SyntheticEvent<HTMLInputElement>) =>
    this.setState({ snapshotIndex: parseInt(event.currentTarget.value, 10) });

  inspect = () => this.setState({ inspectSelectedFiber: true });

  inspectFiber = (fiber: Object) =>
    this.setState({
      inspectSelectedFiber: true,
      selectedFiber: fiber,
    });

  selectChart = (chart: Chart) =>
    this.setState({
      selectedChart: chart,
      selectedFiber: null,
    });

  selectNextSnapshotIndex = (event: SyntheticEvent<HTMLButtonElement>) =>
    this.setState(prevState => ({ snapshotIndex: prevState.snapshotIndex + 1 }));

  selectPreviousSnapshotIndex = (event: SyntheticEvent<HTMLButtonElement>) =>
    this.setState(prevState => ({ snapshotIndex: prevState.snapshotIndex - 1 }));

  selectFiber = (fiber: Object) =>
    this.setState({ selectedFiber: fiber });

  selectSnapshot = (snapshot: Snapshot) =>
    this.setState({
      inspectSelectedFiber: false,
      snapshotIndex: this.props.snapshots.indexOf(snapshot),
    });

  stopInspecting = () => this.setState({ inspectSelectedFiber: false });

  render() {
    const { theme } = this.context;
    const { isRecording, snapshots, toggleIsRecording } = this.props;
    const { inspectSelectedFiber, selectedChart, selectedFiber, snapshotIndex } = this.state;

    let content;
    if (isRecording) {
      content = (
        <RecordingInProgress theme={theme} stopRecording={toggleIsRecording} />
      );
    } else if (snapshots.length > 0) {
      if (inspectSelectedFiber && selectedFiber !== null) {
        content = (
          <FiberRenderDurations
            selectedFiberID={selectedFiber.id}
            selectSnapshot={this.selectSnapshot}
            snapshots={snapshots}
            stopInspecting={this.stopInspecting}
            theme={theme}
          />
        );
      } else {
        const ChartComponent = selectedChart === 'ranked'
          ? RankedSnapshot
          : SnapshotFlamegraph;
        content = (
          <ChartComponent
            inspectFiber={this.inspectFiber}
            selectedFiberID={selectedFiber ? selectedFiber.id : null}
            selectFiber={this.selectFiber}
            snapshot={snapshots[snapshotIndex]}
            theme={theme}
          />
        );
      }
    } else {
      content = (
        <InactiveNoData startRecording={toggleIsRecording} theme={theme} />
      );
    }

    return (
      <div style={styles.container}>
        <div style={styles.Left}>
          <div style={styles.settingsRowStyle(theme)}>
            <RecordButton
              isActive={isRecording}
              onClick={toggleIsRecording}
              theme={theme}
            />

            <div style={{flex: 1}} />

            {!isRecording && snapshots.length > 0 && (
              <Fragment>
                <label>
                  <input
                    type="radio"
                    checked={selectedChart === 'flamegraph'}
                    onChange={() => this.selectChart('flamegraph')}
                  /> Flamegraph
                </label>
                <label>
                  <input
                    type="radio"
                    checked={selectedChart === 'ranked'}
                    onChange={() => this.selectChart('ranked')}
                  /> Ranked
                </label>

                <div style={{flex: 1}} />

                <span>Render ({snapshotIndex + 1} / {snapshots.length})</span>
                <BackButton
                  disabled={snapshotIndex === 0}
                  onClick={this.selectPreviousSnapshotIndex}
                  theme={theme}
                />
                <input
                  type="range"
                  min={0}
                  max={snapshots.length - 1}
                  value={snapshotIndex}
                  onChange={this.handleSnapshotSliderChange}
                />
                <ForwardButton
                  disabled={snapshotIndex === snapshots.length - 1}
                  onClick={this.selectNextSnapshotIndex}
                  theme={theme}
                />
              </Fragment>
            )}
          </div>
          <div style={styles.Content}>
            {content}
          </div>
        </div>
        <div style={styles.Right(theme)}>
          {selectedFiber && (
            <FiberDetailPane
              fiber={selectedFiber}
              inspect={this.inspect}
              isInspecting={inspectSelectedFiber}
            />
          )}
        </div>
      </div>
    );
  }
}

// TODO Maybe move into its own file?
// TODO Flow type
const FiberDetailPane = ({ fiber, inspect, isInspecting }) => (
  <div style={styles.column}>
    <div style={styles.SelectedFiberName}>
      {fiber.name || 'Unknown'}
    </div>
    <button
      disabled={isInspecting}
      onClick={inspect}
    >
      Inspect
    </button>
  </div>
);

const BackButton = Hoverable(
  ({ disabled, isActive, isHovered, onClick, onMouseEnter, onMouseLeave, theme }) => (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={clearButtonStyle(isActive, !disabled, isHovered, theme)}
      title="Clear profiling data"
    >
      <SvgIcon path={Icons.BACK} />
    </button>
  )
);

const ForwardButton = Hoverable(
  ({ disabled, isActive, isHovered, onClick, onMouseEnter, onMouseLeave, theme }) => (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={clearButtonStyle(isActive, !disabled, isHovered, theme)}
      title="Clear profiling data"
    >
      <SvgIcon path={Icons.FORWARD} />
    </button>
  )
);

const clearButtonStyle = (isActive: boolean, isEnabled: boolean, isHovered: boolean, theme: Theme) => ({
  background: 'none',
  border: 'none',
  outline: 'none',
  cursor: isEnabled ? 'pointer' : 'default',
  color: isHovered ? theme.state06 : theme.base05,
  opacity: isEnabled ? 1 : 0.5,
  padding: '4px 8px',
});

const InactiveNoData = ({startRecording, theme}) => (
  <span style={styles.InactiveNoData}>
    Click the record button <RecordButton
      isActive={false}
      onClick={startRecording}
      theme={theme}
    /> to start a new recording.
  </span>
);

const RecordingInProgress = ({stopRecording, theme}) => (
  <span style={styles.RecordingInProgress}>
    Recording profiling data...
    <button
      onClick={stopRecording}
      style={styles.stopRecordingButtonStyle(theme)}
      title="Stop recording"
    >
      Stop
    </button>
  </span>
);

const RecordButton = Hoverable(
  ({ isActive, isHovered, onClick, onMouseEnter, onMouseLeave, theme }) => (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={styles.recordButtonStyle(isActive, isHovered, theme)}
      title={isActive
        ? 'Stop recording'
        : 'Record profiling information'
      }
    >
      <SvgIcon path={Icons.RECORD} />
    </button>
  )
);

var styles = {
  container: {
    width: '100%',
    flex: 1,
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'stretch',
    flexDirection: 'row',
    fontFamily: sansSerif.family,
    fontSize: sansSerif.sizes.normal,
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
  InactiveNoData: {
    height: '100%',
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  RecordingInProgress: {
    height: '100%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  SelectedFiberName: {
    fontFamily: monospace.family,
    fontSize: sansSerif.sizes.large,
    marginBottom: '1rem',
  },
  Content: {
    flex: 1,
    padding: '0.5rem',
    boxSizing: 'border-box',
  },
  Left: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  Right: (theme: Theme) => ({
    flex: '0 1 300px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '0.5rem',
    backgroundColor: theme.base01,
    borderLeft: `1px solid ${theme.base03}`,
    boxSizing: 'border-box',
  }),
  settingsRowStyle: (theme: Theme) => ({
    display: 'flex',
    flex: '0 0 auto',
    padding: '0.25rem',
    flexWrap: 'wrap',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: theme.base01,
    borderBottom: `1px solid ${theme.base03}`,
  }),
  recordButtonStyle: (isActive: boolean, isHovered: boolean, theme: Theme) => ({
    background: 'none',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    color: isActive
      ? theme.special03
      : isHovered ? theme.state06 : theme.base05,
    filter: isActive
      ? `drop-shadow( 0 0 2px ${theme.special03} )`
      : 'none',
    padding: '4px 8px',
  }),
  stopRecordingButtonStyle: (theme: Theme) => ({
    display: 'flex',
    background: theme.state00,
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    color: theme.base00,
    padding: '.5rem 0.75rem',
    marginTop: '0.5rem',
  }),
};

export default decorate({
  store: 'profilerStore',
  listeners: () => ['isRecording', 'snapshots'],
  props(store) {
    return {
      isRecording: !!store.isRecording,
      snapshots: store.snapshots,
      toggleIsRecording: () => store.setIsRecording(!store.isRecording),
    };
  },
}, ProfilerTab);
