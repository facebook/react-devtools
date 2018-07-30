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
import SvgIcon from '../../../frontend/SvgIcon';
import Icons from '../../../frontend/Icons';
import FiberRenderDurations from './FiberRenderDurations';
import InteractionTimeline from './InteractionTimeline';
import SnapshotFlamegraph from './SnapshotFlamegraph';
import SnapshotRanked from './SnapshotRanked';
import ProfilerTabToolbar from './ProfilerTabToolbar';
import ProfilerFiberDetailPane from './ProfilerFiberDetailPane';
import ProfilerInteractionDetailPane from './ProfilerInteractionDetailPane';

type Props = {|
  cacheDataForSnapshot: CacheDataForSnapshot,
  cacheInteractionData: CacheInteractionData,
  getCachedDataForSnapshot: GetCachedDataForSnapshot,
  getCachedInteractionData: GetCachedInteractionData,
  interactionsToSnapshots: Map<Interaction, Set<Snapshot>>,
  isRecording: boolean,
  selectedChartType: ChartType,
  selectedRootID: string | null,
  showNativeNodes: boolean,
  snapshots: Array<Snapshot>,
  timestampsToInteractions: Map<number, Set<Interaction>>,
  toggleIsRecording: () => void,
  toggleShowNativeNodes: () => void,
  updateSelectedChartType: (chartType: ChartType) => void,
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

  inspect = () => this.setState({ isInspectingSelectedFiber: true });

  inspectFiber = (id: string, name: string) =>
    this.setState({
      isInspectingSelectedFiber: true,
      selectedFiberID: id,
      selectedFiberName: name,
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

  selectInteraction = (interaction: Interaction) =>
    this.setState({
      selectedInteraction: interaction,
    });

  selectSnapshot = (snapshot: Snapshot) =>
    this.setState({
      snapshotIndex: this.props.snapshots.indexOf(snapshot),
    });

  stopInspecting = () => this.setState({ isInspectingSelectedFiber: false });

  viewSnapshot = (snapshot: Snapshot) =>
    this.setState({
      isInspectingSelectedFiber: false,
      selectedFiberID: null,
      selectedFiberName: null,
      snapshotIndex: this.props.snapshots.indexOf(snapshot),
    });

  render() {
    const { theme } = this.context;
    const {
      cacheDataForSnapshot,
      cacheInteractionData,
      getCachedDataForSnapshot,
      getCachedInteractionData,
      interactionsToSnapshots,
      isRecording,
      selectedChartType,
      selectedRootID,
      showNativeNodes,
      snapshots,
      timestampsToInteractions,
      toggleIsRecording,
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

    let content;
    if (selectedRootID === null) {
      content = (
        <div
          style={{
            height: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Selected a root in the Elements tab to continue
        </div>
      );
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
      } else if (selectedChartType === 'interactions') {
        content = (
          <InteractionTimeline
            cacheInteractionData={cacheInteractionData}
            getCachedInteractionData={getCachedInteractionData}
            interactionsToSnapshots={interactionsToSnapshots}
            selectedInteraction={selectedInteraction}
            selectedSnapshot={snapshot}
            selectInteraction={this.selectInteraction}
            theme={theme}
            timestampsToInteractions={timestampsToInteractions}
            viewSnapshot={this.viewSnapshot}
          />
        );
      } else {
        const ChartComponent = selectedChartType === 'ranked'
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

    let details;
    if (selectedChartType === 'interactions' && selectedInteraction !== null) {
      details = (
        <ProfilerInteractionDetailPane
          interaction={((selectedInteraction: any): Interaction)}
          selectedSnapshot={snapshot}
          snapshots={((interactionsToSnapshots.get(((selectedInteraction: any): Interaction)): any): Set<Snapshot>)}
          theme={theme}
          viewSnapshot={this.viewSnapshot}
        />
      );
    } else if (selectedChartType !== 'interactions' && selectedFiberName !== null) {
      details = (
        <ProfilerFiberDetailPane
          inspect={this.inspect}
          isInspectingSelectedFiber={isInspectingSelectedFiber}
          name={selectedFiberName}
          snapshot={snapshot}
          snapshotFiber={snapshotFiber}
          theme={theme}
        />
      );
    } else {
      details = (
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
              handleSnapshotSliderChange={this.handleSnapshotSliderChange}
              interactionsCount={interactionsToSnapshots.size}
              isInspectingSelectedFiber={isInspectingSelectedFiber}
              isRecording={isRecording}
              selectChart={this.props.updateSelectedChartType}
              selectNextSnapshotIndex={this.selectNextSnapshotIndex}
              selectPreviousSnapshotIndex={this.selectPreviousSnapshotIndex}
              selectedChartType={selectedChartType}
              showNativeNodes={this.props.showNativeNodes}
              snapshotIndex={snapshotIndex}
              snapshots={snapshots}
              theme={theme}
              toggleIsRecording={toggleIsRecording}
              toggleShowNativeNodes={this.props.toggleShowNativeNodes}
            />
          </div>
          <div style={{
            flex: 1,
            padding: '0.5rem',
            boxSizing: 'border-box',
          }}>
            {content}
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

const InactiveNoData = ({startRecording, theme}) => (
  <div
    style={{
      height: '100%',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <p><strong>No data has been recorded for the selected root.</strong></p>
    <p>
      Click the record button
      <button
        onClick={startRecording}
        style={{
          display: 'inline-block',
          background: theme.base01,
          outline: 'none',
          cursor: 'pointer',
          color: theme.base05,
          padding: '.5rem',
          margin: '0 0.25rem',
          border: `1px solid ${theme.base03}`,
        }}
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
      interactionsToSnapshots: profilerData !== null
        ? profilerData.interactionsToSnapshots
        : new Set(),
      isRecording: !!store.isRecording,
      selectedChartType: store.selectedChartType,
      showNativeNodes: store.showNativeNodes,
      snapshots: profilerData !== null
        ? profilerData.snapshots
        : [],
      timestampsToInteractions: profilerData !== null
        ? profilerData.timestampsToInteractions
        : new Set(),
      toggleIsRecording: () => store.setIsRecording(!store.isRecording),
      toggleShowNativeNodes: () => store.setShowNativeNodes(!store.showNativeNodes),
      updateSelectedChartType: (chartType: ChartType) => store.setSelectedChartType(chartType),
    };
  },
}, ProfilerTab);
