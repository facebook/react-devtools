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

import type {Chart} from './ViewTypes';import type {CacheDataForSnapshot, GetCachedDataForSnapshot, Interaction, RootProfilerData, Snapshot} from '../ProfilerTypes';

import PropTypes from 'prop-types';
import React from 'react';
import decorate from '../../../frontend/decorate';
import {sansSerif} from '../../../frontend/Themes/Fonts';
import SvgIcon from '../../../frontend/SvgIcon';
import Icons from '../../../frontend/Icons';
import FiberRenderDurations from './FiberRenderDurations';
import InteractionTimeline from './InteractionTimeline';
import SnapshotFlamegraph from './SnapshotFlamegraph';
import SnapshotRanked from './SnapshotRanked';
import ProfilerTabToolbar from './ProfilerTabToolbar';
import ProfilerFiberDetailPane from './ProfilerFiberDetailPane';

type Props = {|
  cacheDataForSnapshot: CacheDataForSnapshot,
  getCachedDataForSnapshot: GetCachedDataForSnapshot,
  interactionsToSnapshots: Map<Interaction, Set<Snapshot>>,
  isRecording: boolean,
  selectedRootID: string | null,
  snapshots: Array<Snapshot>,
  timestampsToInteractions: Map<number, Set<Interaction>>,
  toggleIsRecording: (value: boolean) => void,
|};

type State = {|
  isInspectingSelectedFiber: boolean,
  prevIsRecording: boolean,
  selectedChart: Chart,
  selectedFiberID: string | null,
  selectedFiberName: string | null,
  showNativeNodes: boolean,
  snapshotIndex: number,
|};

class ProfilerTab extends React.Component<Props, State> {
  static contextTypes = {
    theme: PropTypes.object.isRequired,
  };

  state: State = {
    isInspectingSelectedFiber: false,
    prevIsRecording: this.props.isRecording,
    selectedChart: 'flamegraph',
    selectedFiberID: null,
    selectedFiberName: null,
    showNativeNodes: false,
    snapshotIndex: 0,
  };

  static getDerivedStateFromProps(props: Props, state: State): $Shape<State> {
    if (props.isRecording !== state.prevIsRecording) {
      return {
        prevIsRecording: props.isRecording,
        selectedChart: 'flamegraph',
        selectedFiberID: null,
        selectedFiberName: null,
        snapshotIndex: 0,
      };
    }
    return null;
  }

  deselectFiber = () =>
    this.setState({
      selectedFiberID: null,
      selectedFiberName: null,
    });


  handleSnapshotSliderChange = (event: SyntheticEvent<HTMLInputElement>) =>
    this.setState({ snapshotIndex: parseInt(event.currentTarget.value, 10) });

  inspect = () => this.setState({ isInspectingSelectedFiber: true });

  inspectFiber = (id: string, name: string) =>
    this.setState({
      isInspectingSelectedFiber: true,
      selectedFiberID: id,
      selectedFiberName: name,
    });

  selectChart = (chart: Chart) =>
    this.setState({
      isInspectingSelectedFiber: false,
      selectedChart: chart,
      selectedFiberID: null,
      selectedFiberName: null,
    });

  selectNextSnapshotIndex = (event: SyntheticEvent<HTMLButtonElement>) =>
    this.setState(prevState => ({ snapshotIndex: prevState.snapshotIndex + 1 }));

  selectPreviousSnapshotIndex = (event: SyntheticEvent<HTMLButtonElement>) =>
    this.setState(prevState => ({ snapshotIndex: prevState.snapshotIndex - 1 }));

  // We store the ID and name separately,
  // Because a Fiber may not exist in all snapshots.
  // In that case, it's still important to show the selected fiber (name) in the details pane.
  selectFiber = (id: string, name: string) =>
    this.setState({
      selectedFiberID: id,
      selectedFiberName: name,
    });

  selectInteractionSnapshot = (snapshot: Snapshot) =>
    this.setState({
      isInspectingSelectedFiber: false,
      selectedChart: 'flamegraph',
      selectedFiberID: null,
      selectedFiberName: null,
      snapshotIndex: this.props.snapshots.indexOf(snapshot),
    });

  selectSnapshot = (snapshot: Snapshot) =>
    this.setState({
      snapshotIndex: this.props.snapshots.indexOf(snapshot),
    });

  stopInspecting = () => this.setState({ isInspectingSelectedFiber: false });

  toggleShowNativeNodes = () =>
    this.setState(prevState => ({
      selectedFiberID: null,
      selectedFiberName: null,
      showNativeNodes: !prevState.showNativeNodes,
    }));

  render() {
    const { theme } = this.context;
    const { cacheDataForSnapshot, getCachedDataForSnapshot, interactionsToSnapshots, isRecording, selectedRootID, snapshots, timestampsToInteractions, toggleIsRecording } = this.props;
    const { isInspectingSelectedFiber, selectedChart, selectedFiberID, selectedFiberName, showNativeNodes, snapshotIndex } = this.state;

    const snapshot = snapshots[snapshotIndex];
    const snapshotFiber = selectedFiberID && snapshot.nodes.get(selectedFiberID) || null;

    let content;
    if (selectedRootID === null) {
      content = 'Selected a root in the Elements tab to continue'; // TODO (bvaughn) Center align
    } else if (isRecording) {
      content = (
        <RecordingInProgress theme={theme} stopRecording={toggleIsRecording} />
      );
    } else if (snapshots.length > 0) {
      if (isInspectingSelectedFiber && selectedFiberID !== null) {
        content = (
          <FiberRenderDurations
            selectedFiberID={selectedFiberID}
            selectSnapshot={this.selectSnapshot}
            snapshots={snapshots}
            stopInspecting={this.stopInspecting}
            theme={theme}
          />
        );
      } else if (selectedChart === 'interactions') {
        content = (
          <InteractionTimeline
            interactionsToSnapshots={interactionsToSnapshots}
            selectedSnapshot={snapshot}
            selectSnapshot={this.selectInteractionSnapshot}
            theme={theme}
            timestampsToInteractions={timestampsToInteractions}
          />
        );
      } else {
        const ChartComponent = selectedChart === 'ranked'
          ? SnapshotRanked
          : SnapshotFlamegraph;

        content = (
          <ChartComponent
            cacheDataForSnapshot={cacheDataForSnapshot}
            getCachedDataForSnapshot={getCachedDataForSnapshot}
            inspectFiber={this.inspectFiber}
            selectedFiberID={selectedFiberID}
            selectFiber={this.selectFiber}
            showNativeNodes={showNativeNodes}
            snapshot={snapshot}
            snapshotIndex={snapshotIndex}
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
      <div style={styles.container(theme)}>
        <div style={styles.Left}>
          <div style={styles.Toolbar(theme)}>
            <ProfilerTabToolbar
              handleSnapshotSliderChange={this.handleSnapshotSliderChange}
              interactionsCount={interactionsToSnapshots.size}
              isInspectingSelectedFiber={isInspectingSelectedFiber}
              isRecording={isRecording}
              selectChart={this.selectChart}
              selectNextSnapshotIndex={this.selectNextSnapshotIndex}
              selectPreviousSnapshotIndex={this.selectPreviousSnapshotIndex}
              selectedChart={selectedChart}
              snapshotIndex={snapshotIndex}
              snapshots={snapshots}
              theme={theme}
              toggleIsRecording={toggleIsRecording}
            />
          </div>
          <div style={styles.Content}>
            {content}
          </div>
        </div>
        <div style={styles.Right(theme)}>
          {selectedFiberName && (
            <ProfilerFiberDetailPane
              inspect={this.inspect}
              isInspectingSelectedFiber={isInspectingSelectedFiber}
              name={selectedFiberName}
              snapshot={snapshot}
              snapshotFiber={snapshotFiber}
              theme={theme}
            />
          )}
          {!selectedFiberName && (
            <div style={styles.FiberDetailPaneEmpty(theme)}>
              Nothing select
            </div>
          )}
        </div>
      </div>
    );
  }
}

const InactiveNoData = ({startRecording, theme}) => (
  <div style={styles.InactiveNoData}>
    <p><strong>No data has been recorded for the selected root.</strong></p>
    <p>
      Click the record button
      <button
        onClick={startRecording}
        style={styles.startRecordingButtonStyle(theme)}
        title="Start recording"
      >
        <SvgIcon
          path={Icons.RECORD}
          style={{
            flex: '0 0 1rem',
            width: '1rem',
            height: '1rem',
            fill: 'currentColor',
            display: 'inline',
            verticalAlign: 'sub',
          }}
        />
      </button>
      to start a new recording.
    </p>
  </div>
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

var styles = {
  container: (theme: Theme) => ({
    width: '100%',
    flex: 1,
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'stretch',
    flexDirection: 'row',
    color: theme.base05,
    fontFamily: sansSerif.family,
    fontSize: sansSerif.sizes.normal,
  }),
  InactiveNoData: {
    height: '100%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
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
  FiberDetailPaneEmpty: (theme: Theme) => ({
    color: theme.base04,
    fontSize: sansSerif.sizes.large,
    height: '100%',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.25rem',
  }),
  Toolbar: (theme: Theme) => ({
    position: 'relative',
    backgroundColor: theme.base01,
    borderBottom: `1px solid ${theme.base03}`,
  }),
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
    maxWidth: '300px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'stretch',
    borderLeft: `1px solid ${theme.base03}`,
    boxSizing: 'border-box',
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
  startRecordingButtonStyle: (theme: Theme) => ({
    display: 'inline-block',
    background: theme.base01,
    outline: 'none',
    cursor: 'pointer',
    color: theme.base05,
    padding: '.5rem',
    margin: '0 0.25rem',
    border: `1px solid ${theme.base03}`,
  }),
};

export default decorate({
  store: 'profilerStore',
  listeners: () => ['isRecording', 'selectedRoot', 'profilerData'],
  props(store) {
    const profilerData: RootProfilerData | null =
      store.rootsToProfilerData.has(store.selectedRoot)
        ? ((store.rootsToProfilerData.get(store.selectedRoot): any): RootProfilerData)
        : null;

    return {
      cacheDataForSnapshot: (...args) => store.cacheDataForSnapshot(...args),
      getCachedDataForSnapshot: (...args) => store.getCachedDataForSnapshot(...args),
      interactionsToSnapshots: profilerData !== null
        ? profilerData.interactionsToSnapshots
        : new Set(),
      isRecording: !!store.isRecording,
      snapshots: profilerData !== null
        ? profilerData.snapshots
        : [],
      timestampsToInteractions: profilerData !== null
        ? profilerData.timestampsToInteractions
        : new Set(),
      toggleIsRecording: () => store.setIsRecording(!store.isRecording),
    };
  },
}, ProfilerTab);
