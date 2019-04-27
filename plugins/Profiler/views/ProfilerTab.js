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

import type {
  CacheDataForSnapshot,
  CacheInteractionData,
  ChartType,
  GetCachedDataForSnapshot,
  GetCachedInteractionData,
  Interaction,
  RootProfilerData,
  Snapshot,
} from '../ProfilerTypes';

import PropTypes from 'prop-types';
import React from 'react';
import decorate from '../../../frontend/decorate';
import {sansSerif} from '../../../frontend/Themes/Fonts';
import { getMaxDuration } from './constants';
import FiberRenderDurations from './FiberRenderDurations';
import InteractionTimeline from './InteractionTimeline';
import NoProfilingDataMessage from './NoProfilingDataMessage';
import SnapshotFlamegraph from './SnapshotFlamegraph';
import SnapshotRanked from './SnapshotRanked';
import ProfilerTabToolbar from './ProfilerTabToolbar';
import ProfilerFiberDetailPane from './ProfilerFiberDetailPane';
import ProfilerSnapshotDetailPane from './ProfilerSnapshotDetailPane';
import ProfilerInteractionDetailPane from './ProfilerInteractionDetailPane';
import ProfilerSettings from './ProfilerSettings';

type Props = {|
  cacheDataForSnapshot: CacheDataForSnapshot,
  cacheInteractionData: CacheInteractionData,
  commitThreshold: number,
  getCachedDataForSnapshot: GetCachedDataForSnapshot,
  getCachedInteractionData: GetCachedInteractionData,
  hasMultipleRoots: boolean,
  hideCommitsBelowThreshold: boolean,
  interactionsToSnapshots: Map<Interaction, Set<Snapshot>>,
  isRecording: boolean,
  profilerData: RootProfilerData,
  selectedChartType: ChartType,
  selectedRootID: string | null,
  setSelectedChartType: (chartType: ChartType) => void,
  showNativeNodes: boolean,
  snapshots: Array<Snapshot>,
  timestampsToInteractions: Map<number, Set<Interaction>>,
  toggleIsRecording: Function,
  toggleIsSettingsPanelActive: Function,
|};

type State = {|
  isInspectingSelectedFiber: boolean,
  prevIsRecording: boolean,
  prevSelectedChartType: ChartType,
  prevShowNativeNodes: boolean,
  selectedFiberID: string | null,
  selectedFiberName: string | null,
  selectedInteraction: Interaction | null,
  snapshotIndex: number,
|};

class ProfilerTab extends React.Component<Props, State> {
  static contextTypes = {
    theme: PropTypes.object.isRequired,
  };

  state: State = {
    isInspectingSelectedFiber: false,
    prevIsRecording: this.props.isRecording,
    prevSelectedChartType: this.props.selectedChartType,
    prevShowNativeNodes: this.props.showNativeNodes,
    selectedFiberID: null,
    selectedFiberName: null,
    selectedInteraction: null,
    snapshotIndex: 0,
  };

  static getDerivedStateFromProps(props: Props, state: State): $Shape<State> {
    if (props.isRecording !== state.prevIsRecording) {
      return {
        isInspectingSelectedFiber: false,
        prevIsRecording: props.isRecording,
        selectedFiberID: null,
        selectedFiberName: null,
        selectedInteraction: null,
        snapshotIndex: 0,
      };
    }
    if (props.selectedChartType !== state.prevSelectedChartType) {
      return {
        isInspectingSelectedFiber: false,
        prevSelectedChartType: props.selectedChartType,
        selectedFiberID: null,
        selectedFiberName: null,
      };
    }
    if (props.showNativeNodes !== state.prevShowNativeNodes) {
      return {
        isInspectingSelectedFiber: false,
        prevShowNativeNodes: props.showNativeNodes,
        selectedFiberID: null,
        selectedFiberName: null,
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

  inspectFiber = (id: string, name: string) =>
    this.setState({
      isInspectingSelectedFiber: true,
      selectedFiberID: id,
      selectedFiberName: name,
    });

  // We store the ID and name separately,
  // Because a Fiber may not exist in all snapshots.
  // In that case, it's still important to show the selected fiber (name) in the details pane.
  selectFiber = (id: string, name: string) =>
    this.setState({
      selectedFiberID: id,
      selectedFiberName: name,
    });

  selectInteraction = (interaction: Interaction) =>
    this.setState({
      selectedInteraction: interaction,
    });

  selectSnapshot = (snapshot: Snapshot) =>
    this.setState({
      snapshotIndex: this.props.snapshots.indexOf(snapshot),
    });

  stopInspecting = () => this.setState({ isInspectingSelectedFiber: false });

  toggleInspectingSelectedFiber = () => this.setState(state => ({
    isInspectingSelectedFiber: !state.isInspectingSelectedFiber,
  }));

  viewInteraction = (interaction: Interaction) =>
    this.setState({
      selectedInteraction: interaction,
    }, () => this.props.setSelectedChartType('interactions'));

  viewSnapshot = (snapshot: Snapshot) =>
    this.setState({
      isInspectingSelectedFiber: false,
      selectedFiberID: null,
      selectedFiberName: null,
      snapshotIndex: this.props.snapshots.indexOf(snapshot),
    }, () => this.props.setSelectedChartType('flamegraph'));

  render() {
    const { theme } = this.context;
    const {
      cacheDataForSnapshot,
      cacheInteractionData,
      commitThreshold,
      getCachedDataForSnapshot,
      getCachedInteractionData,
      hasMultipleRoots,
      hideCommitsBelowThreshold,
      interactionsToSnapshots,
      isRecording,
      profilerData,
      selectedChartType,
      selectedRootID,
      showNativeNodes,
      snapshots,
      timestampsToInteractions,
      toggleIsRecording,
      toggleIsSettingsPanelActive,
    } = this.props;
    const {
      isInspectingSelectedFiber,
      selectedFiberID,
      selectedFiberName,
      selectedInteraction,
      snapshotIndex,
    } = this.state;

    const snapshot = snapshots[snapshotIndex];
    const snapshotFiber = selectedFiberID && snapshot.nodes.get(selectedFiberID) || null;
    const maxDuration = getMaxDuration(snapshots);

    let content;
    if (isRecording) {
      content = (
        <RecordingInProgress theme={theme} stopRecording={toggleIsRecording} />
      );
    } else if (selectedRootID === null || profilerData === null) {
      // Edge case where keyboard up/down arrows change selected root in the Elements tab.
      // This is a bug that should be fixed separately from the Profiler plug-in.
      content = (
        <NoProfilingDataMessage
          hasMultipleRoots={hasMultipleRoots}
          startRecording={toggleIsRecording}
          theme={theme}
        />
      );
    } else if (snapshots.length > 0) {
      if (isInspectingSelectedFiber && selectedFiberID !== null) {
        content = (
          <FiberRenderDurations
            commitThreshold={commitThreshold}
            hideCommitsBelowThreshold={hideCommitsBelowThreshold}
            selectedFiberID={selectedFiberID}
            selectedSnapshot={snapshot}
            selectSnapshot={this.selectSnapshot}
            snapshotIndex={snapshotIndex}
            snapshots={snapshots}
            stopInspecting={this.stopInspecting}
          />
        );
      } else if (selectedChartType === 'interactions') {
        content = (
          <InteractionTimeline
            cacheInteractionData={cacheInteractionData}
            getCachedInteractionData={getCachedInteractionData}
            hasMultipleRoots={hasMultipleRoots}
            interactionsToSnapshots={interactionsToSnapshots}
            maxDuration={maxDuration}
            selectedInteraction={selectedInteraction}
            selectedSnapshot={snapshot}
            selectInteraction={this.selectInteraction}
            theme={theme}
            timestampsToInteractions={timestampsToInteractions}
          />
        );
      } else {
        const ChartComponent = selectedChartType === 'ranked'
          ? SnapshotRanked
          : SnapshotFlamegraph;

        content = (
          <ChartComponent
            cacheDataForSnapshot={cacheDataForSnapshot}
            deselectFiber={this.deselectFiber}
            getCachedDataForSnapshot={getCachedDataForSnapshot}
            inspectFiber={this.inspectFiber}
            selectedFiberID={selectedFiberID}
            selectFiber={this.selectFiber}
            showNativeNodes={showNativeNodes}
            snapshot={snapshot}
            snapshotIndex={snapshotIndex}
          />
        );
      }
    } else {
      content = (
        <NoProfilingDataMessage
          hasMultipleRoots={hasMultipleRoots}
          startRecording={toggleIsRecording}
          theme={theme}
        />
      );
    }

    let details;
    if (isRecording || selectedRootID === null || profilerData === null) {
      // Edge case where keyboard up/down arrows change selected root in the Elements tab.
      // This is a bug that should be fixed separately from the Profiler plug-in.
      details = (
        <DetailsNoData theme={theme} />
      );
    } else if ((selectedChartType === 'flamegraph' || selectedChartType === 'ranked') && selectedFiberName === null) {
      details = (
        <ProfilerSnapshotDetailPane
          selectedInteraction={selectedInteraction}
          snapshot={snapshot}
          theme={theme}
          viewInteraction={this.viewInteraction}
        />
      );
    } else if (selectedChartType === 'interactions' && selectedInteraction !== null) {
      details = (
        <ProfilerInteractionDetailPane
          interaction={((selectedInteraction: any): Interaction)}
          maxDuration={getMaxDuration(snapshots)}
          selectedSnapshot={snapshot}
          snapshots={((interactionsToSnapshots.get(((selectedInteraction: any): Interaction)): any): Set<Snapshot>)}
          theme={theme}
          viewSnapshot={this.viewSnapshot}
        />
      );
    } else if (selectedChartType !== 'interactions' && selectedFiberName !== null) {
      details = (
        <ProfilerFiberDetailPane
          deselectFiber={this.deselectFiber}
          isInspectingSelectedFiber={isInspectingSelectedFiber}
          name={selectedFiberName}
          snapshot={snapshot}
          snapshotFiber={snapshotFiber}
          toggleInspectingSelectedFiber={this.toggleInspectingSelectedFiber}
          theme={theme}
        />
      );
    } else {
      details = (
        <DetailsNoData theme={theme} />
      );
    }

    return (
      <div style={{
        width: '100%',
        flex: 1,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'stretch',
        flexDirection: 'row',
        color: theme.base05,
        fontFamily: sansSerif.family,
        fontSize: sansSerif.sizes.normal,
      }}>
        <div style={{
          flex: '1 1 200px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            position: 'relative',
            backgroundColor: theme.base01,
            borderBottom: `1px solid ${theme.base03}`,
          }}>
            <ProfilerTabToolbar
              commitThreshold={commitThreshold}
              hideCommitsBelowThreshold={hideCommitsBelowThreshold}
              interactionsCount={interactionsToSnapshots.size}
              isInspectingSelectedFiber={isInspectingSelectedFiber}
              isRecording={isRecording}
              selectChart={this.props.setSelectedChartType}
              selectedChartType={selectedChartType}
              selectedFiberID={selectedFiberID}
              selectedSnapshot={snapshot}
              selectSnapshot={this.selectSnapshot}
              snapshotIndex={snapshotIndex}
              snapshots={snapshots}
              theme={theme}
              toggleIsRecording={toggleIsRecording}
              toggleIsSettingsPanelActive={toggleIsSettingsPanelActive}
            />
          </div>
          <div style={{
            flex: 1,
            padding: '0.5rem',
            boxSizing: 'border-box',
            position: 'relative',
          }}>
            {content}

            <ProfilerSettings />
          </div>
        </div>
        <div style={{
          flex: '1 1 100px',
          maxWidth: '300px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'stretch',
          borderLeft: `1px solid ${theme.base03}`,
          boxSizing: 'border-box',
        }}>
          {details}
        </div>
      </div>
    );
  }
}

const DetailsNoData = ({ theme }) => (
  <div style={{
    color: theme.base04,
    fontSize: sansSerif.sizes.large,
    height: '100%',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.25rem',
  }}>
    Nothing selected
  </div>
);

const RecordingInProgress = ({stopRecording, theme}) => (
  <span style={{
    height: '100%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    Recording profiling data...
    <button
      onClick={stopRecording}
      style={{
        display: 'flex',
        background: theme.state00,
        border: 'none',
        outline: 'none',
        cursor: 'pointer',
        color: theme.base00,
        padding: '.5rem 0.75rem',
        marginTop: '0.5rem',
      }}
      title="Stop recording"
    >
      Stop
    </button>
  </span>
);

export default decorate({
  store: 'profilerStore',
  listeners: () => [
    'commitThreshold',
    'hideCommitsBelowThreshold',
    'isRecording',
    'profilerData',
    'selectedChartType',
    'selectedRoot',
    'showNativeNodes',
  ],
  props(store) {
    const profilerData: RootProfilerData | null =
      store.rootsToProfilerData.has(store.selectedRoot)
        ? ((store.rootsToProfilerData.get(store.selectedRoot): any): RootProfilerData)
        : null;

    return {
      cacheDataForSnapshot: (...args) => store.cacheDataForSnapshot(...args),
      cacheInteractionData: (...args) => store.cacheInteractionData(...args),
      getCachedDataForSnapshot: (...args) => store.getCachedDataForSnapshot(...args),
      getCachedInteractionData: (...args) => store.getCachedInteractionData(...args),
      commitThreshold: store.commitThreshold,
      hasMultipleRoots: store.roots.size > 1,
      hideCommitsBelowThreshold: store.hideCommitsBelowThreshold,
      interactionsToSnapshots: profilerData !== null
        ? profilerData.interactionsToSnapshots
        : new Map(),
      isRecording: !!store.isRecording,
      profilerData,
      selectedChartType: store.selectedChartType,
      setSelectedChartType: (chartType: ChartType) => store.setSelectedChartType(chartType),
      showNativeNodes: store.showNativeNodes,
      snapshots: profilerData !== null
        ? profilerData.snapshots
        : [],
      timestampsToInteractions: profilerData !== null
        ? profilerData.timestampsToInteractions
        : new Map(),
      toggleIsRecording: () => store.setIsRecording(!store.isRecording),
      toggleIsSettingsPanelActive: () => store.setIsSettingsPanelActive(!store.isSettingsPanelActive),
    };
  },
}, ProfilerTab);
