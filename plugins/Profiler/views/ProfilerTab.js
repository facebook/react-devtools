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
import type {CacheDataForSnapshot, GetCachedDataForSnapshot, Snapshot} from '../ProfilerTypes';

import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import decorate from '../../../frontend/decorate';
import {monospace, sansSerif} from '../../../frontend/Themes/Fonts';
import DataView from '../../../frontend/DataView/DataView';
import DetailPane from '../../../frontend/detail_pane/DetailPane';
import DetailPaneSection from '../../../frontend/detail_pane/DetailPaneSection';
import SvgIcon from '../../../frontend/SvgIcon';
import Icons from '../../../frontend/Icons';
import Hoverable from '../../../frontend/Hoverable';
import FiberRenderDurations from './FiberRenderDurations';
import SnapshotFlamegraph from './SnapshotFlamegraph';
import RankedSnapshot from './RankedSnapshot';

type Chart = 'flamegraph' | 'ranked';

type Props = {|
  cacheDataForSnapshot: CacheDataForSnapshot,
  getCachedDataForSnapshot: GetCachedDataForSnapshot,
  isRecording: boolean,
  selectedRootID: string | null,
  snapshots: Array<Snapshot>,
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
    const { cacheDataForSnapshot, getCachedDataForSnapshot, isRecording, selectedRootID, snapshots, toggleIsRecording } = this.props;
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
      } else {
        const ChartComponent = selectedChart === 'ranked'
          ? RankedSnapshot
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
                    checked={!isInspectingSelectedFiber && selectedChart === 'flamegraph'}
                    onChange={() => this.selectChart('flamegraph')}
                  /> Flamegraph
                </label>
                &nbsp;
                <label>
                  <input
                    type="radio"
                    checked={!isInspectingSelectedFiber && selectedChart === 'ranked'}
                    onChange={() => this.selectChart('ranked')}
                  /> Ranked
                </label>

                <div style={{flex: 1}} />

                <label
                  style={{
                    opacity: isInspectingSelectedFiber ? 0.5 : 1,
                  }}
                >
                  <input
                    type="checkbox"
                    disabled={isInspectingSelectedFiber}
                    checked={showNativeNodes}
                    onChange={this.toggleShowNativeNodes}
                  /> Show native?
                </label>

                <div style={{flex: 1}} />

                <span>Render ({snapshotIndex + 1} / {snapshots.length})</span>
                <IconButton
                  disabled={snapshotIndex === 0 || isInspectingSelectedFiber}
                  icon={Icons.BACK}
                  isTransparent={true}
                  onClick={this.selectPreviousSnapshotIndex}
                  theme={theme}
                  title="Previous render"
                />
                <input
                  disabled={isInspectingSelectedFiber}
                  type="range"
                  min={0}
                  max={snapshots.length - 1}
                  value={snapshotIndex}
                  onChange={this.handleSnapshotSliderChange}
                />
                <IconButton
                  disabled={snapshotIndex === snapshots.length - 1 || isInspectingSelectedFiber}
                  icon={Icons.FORWARD}
                  isTransparent={true}
                  onClick={this.selectNextSnapshotIndex}
                  theme={theme}
                  title="Next render"
                />
              </Fragment>
            )}
          </div>
          <div style={styles.Content}>
            {content}
          </div>
        </div>
        <div style={styles.Right(theme)}>
          {selectedFiberName && (
            <FiberDetailPane
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

const emptyFunction = () => {};

// TODO Maybe move into its own file?
// TODO Flow type
const FiberDetailPane = ({ inspect, isInspectingSelectedFiber, name = 'Unknown', snapshot, snapshotFiber, theme }) => (
  <Fragment>
    <div style={styles.FiberDetailPaneHeader(theme)}>
      <div style={styles.SelectedFiberName} title={name}>
        {name}
      </div>
      <IconButton
        disabled={isInspectingSelectedFiber}
        icon={Icons.BARS}
        onClick={inspect}
        theme={theme}
        title={`Inspect ${name}`}
      />
    </div>
    {snapshotFiber !== null && (
      <div style={styles.DetailPaneWrapper}>
        <DetailPane theme={theme}>
          <DetailPaneSection title="Props">
            <DataView
              path={['props']}
              readOnly={true}
              inspect={emptyFunction}
              showMenu={emptyFunction}
              data={snapshotFiber.get('props')}
            />
          </DetailPaneSection>
          {snapshotFiber.get('state') && (
            <DetailPaneSection title="State">
              <DataView
                path={['state']}
                readOnly={true}
                inspect={emptyFunction}
                showMenu={emptyFunction}
                data={snapshotFiber.get('state')}
              />
            </DetailPaneSection>
          )}
        </DetailPane>
      </div>
    )}
  </Fragment>
);

const IconButton = Hoverable(
  ({ disabled, icon, isActive = false, isHovered, isTransparent = false, onClick, onMouseEnter, onMouseLeave, theme, title }) => (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={iconButtonStyle(isActive, !disabled, isHovered, isTransparent, theme)}
      title={title}
    >
      <SvgIcon path={icon} />
    </button>
  )
);

const iconButtonStyle = (isActive: boolean, isEnabled: boolean, isHovered: boolean, isTransparent: boolean, theme: Theme) => ({
  background: isTransparent ? 'none' : theme.base00,
  border: 'none',
  outline: 'none',
  cursor: isEnabled ? 'pointer' : 'default',
  color: isHovered ? theme.state06 : theme.base05,
  opacity: isEnabled ? 1 : 0.5,
  padding: '4px 8px',
});

const InactiveNoData = ({startRecording, theme}) => (
  <div style={styles.InactiveNoData}>
    <p>No data has been recorded for the selected root.</p>
    <p>
      Click the record button <RecordButton
        isActive={false}
        onClick={startRecording}
        theme={theme}
      /> to start a new recording.
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

const RecordButton = Hoverable(
  ({ isActive, isHovered, onClick, onMouseEnter, onMouseLeave, theme }) => (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={styles.recordButtonStyle(isActive, isHovered, theme)}
      title={isActive ? 'Stop profiling' : 'Start profiling'}
    >
      <SvgIcon path={Icons.RECORD} />
    </button>
  )
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
  DetailPaneWrapper: {
    flex: 1,
    overflow: 'auto',
  },
  FiberDetailPaneHeader: (theme: Theme) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.25rem',
    backgroundColor: theme.base01,
    borderBottom: `1px solid ${theme.base03}`,
    boxSizing: 'border-box',
  }),
  SelectedFiberName: {
    fontFamily: monospace.family,
    fontSize: monospace.sizes.large,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  ClearButton: {
    marginBottom: '0.5rem',
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
    maxWidth: '300px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'stretch',
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
  listeners: () => ['isRecording', 'selectedRoot', 'snapshots'],
  props(store) {
    return {
      cacheDataForSnapshot: (...args) => store.cacheDataForSnapshot(...args),
      getCachedDataForSnapshot: (...args) => store.getCachedDataForSnapshot(...args),
      isRecording: !!store.isRecording,
      snapshots: store.snapshots.filter(snapshot => snapshot.root === store.selectedRoot),
      toggleIsRecording: () => store.setIsRecording(!store.isRecording),
    };
  },
}, ProfilerTab);
