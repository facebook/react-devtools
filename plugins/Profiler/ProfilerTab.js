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

import type {Theme} from '../../frontend/types';
import type {Snapshot} from './ProfilerTypes';

const PropTypes = require('prop-types');

var React = require('react');
var decorate = require('../../frontend/decorate');
var {sansSerif} = require('../../frontend/Themes/Fonts');
const SvgIcon = require('../../frontend/SvgIcon');
const Icons = require('../../frontend/Icons');
const Hoverable = require('../../frontend/Hoverable');
const Flamegraph = require('./Flamegraph');

// TODO Each flame graph should be the entire fiber tree (at the time of this commit).
// The widths should be the tree base times.
// Horizontal offsets should just be center-aligned within their parents.
// Color should indicate whether the component re-rendered (actualDuration > 0).
// Changes in base time could perhaps be animated between commits.

// TODO Better Flow types for snapshot
const preprocessNode = (snapshot: any, nodeID, parentID = null, startTimeOffset = 0) => {
  const { nodes, nodeDepths, nodeStartTimes } = snapshot;

  const node = nodes.get(nodeID);

  let depth = 0;
  let startTime = 0;

  // Parent/child alignment should be:
  // |----------------------------------|
  // | A                                |
  // |----------------------------------|
  //           |---------| |------------|
  //           | B       | | C          |
  //           |---------| |------------|
  //                            |-------|
  //                            | D     |
  //                            |-------|
  if (parentID !== null) {
    const parentDepth = nodeDepths.get(parentID);
    const parentStartTime = nodeStartTimes.get(parentID);

    depth = parentDepth + 1;
    startTime = parentStartTime + startTimeOffset;

    snapshot.maxDepth = Math.max(snapshot.maxDepth, depth);
  }

  nodeDepths.set(nodeID, depth);
  nodeStartTimes.set(nodeID, startTime);

  let children = node.get('children');
  if (children) {
    if (!Array.isArray(children)) {
      children = [children];
    }

    const totalChildBaseTimes = children.reduce((totalTime, childID) => {
      const childNode = nodes.get(childID);
      return (childNode != null ? childNode.get('treeBaseTime') : 0) + totalTime;
    }, 0);

    if (totalChildBaseTimes > 0) {
      let childStartTimeOffset = node.get('treeBaseTime') - totalChildBaseTimes;

      children.forEach(childID => {
        preprocessNode(snapshot, childID, nodeID, childStartTimeOffset);

        childStartTimeOffset += nodes.get(childID).get('treeBaseTime');
      });
    }
  }
};

// TODO Better Flow types for snapshot
const preprocessSnapshot = (snapshot: any) => {
  snapshot.maxDepth = 0;
  snapshot.nodeDepths = new Map();
  snapshot.nodeStartTimes = new Map();

  // Don't include the root itself.
  // It doesn't have a name or a base time and isn't meaningful to users.
  const rootNode = snapshot.nodes.get(snapshot.root);
  const children = rootNode.get('children');
  const rootNodeID = Array.isArray(children) ? children[0] : children;

  preprocessNode(snapshot, rootNodeID);
};

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
        <Snapshots snapshots={snapshots} theme={theme} />
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

type SnapshotProps = {
  snapshots: Array<Snapshot>,
  theme: any,
};
type SnapshotState = {
  selectedIndex: number
};
class Snapshots extends React.Component<SnapshotProps, SnapshotState> {
  state: SnapshotState = {
    selectedIndex: 0,
  };

  handleChange = index => this.setState({ selectedIndex: index });

  render() {
    const {snapshots, theme} = this.props;
    const {selectedIndex} = this.state;
    const selectedSnapshot = snapshots[selectedIndex];

    console.log(JSON.stringify(snapshots, null, 2));
    return (
      <div style={styles.content}>
        <div>
          {snapshots.map((snapshot, index) => (
            <label key={index}>
              <input type="radio" onChange={() => this.handleChange(index)} checked={index === selectedIndex} />
              {Math.round(snapshot.commitTime * 10) / 10}ms
            </label>
          ))}
        </div>
        <SnapshotView snapshot={selectedSnapshot} theme={theme} />
      </div>
    );
  }
}

const SnapshotView = ({snapshot, theme}) => {
  preprocessSnapshot(snapshot);

  const rootNode = snapshot.nodes.get(snapshot.root);
  const children = rootNode.get('children');
  const rootNodeID = Array.isArray(children) ? children[0] : children;

  return (
    <Flamegraph
      rootNodeID={rootNodeID}
      snapshot={snapshot}
      width={1280}
      height={200}
    />
  );
};

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

module.exports = decorate({
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
