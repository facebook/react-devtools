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

const React = require('react');
const decorate = require('../../frontend/decorate');
const {sansSerif} = require('../../frontend/Themes/Fonts');
const SvgIcon = require('../../frontend/SvgIcon');
const Icons = require('../../frontend/Icons');
const Hoverable = require('../../frontend/Hoverable');
const Flamegraph = require('./Flamegraph');

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// http://gka.github.io/palettes/#diverging|c0=#34bd65,#f4d03f|c1=#f4d03f,#ea384d,#f5344a|steps=50|bez0=1|bez1=1|coL0=0|coL1=0
const colors = [
  '#34bd65', '#44be64', '#50bf62', '#5bc061', '#65c160', '#6fc25f', '#77c35d', '#80c45c', '#88c55b', '#8fc659', '#97c658',
  '#9ec756', '#a5c855', '#acc953', '#b2ca52', '#b9ca50', '#bfcb4e', '#c6cc4d', '#cccc4b', '#d2cd49', '#d9ce48', '#dfce46',
  '#e5cf44', '#ebcf42', '#f1d040', '#f4cb40', '#f5c142', '#f5b744', '#f5ae46', '#f4a447', '#f49c48', '#f49349', '#f48b49',
  '#f3834a', '#f37c4a', '#f3744b', '#f26d4b', '#f2674b', '#f2604b', '#f25a4b', '#f1544b', '#f14e4b', '#f2494b', '#f2444b',
  '#f2404b', '#f23c4b', '#f3394b', '#f3374a', '#f4354a', '#f5344a',
];

const convertSnapshotToChartData = (snapshot, rootNodeID) => {
  let maxDuration = 0;

  snapshot.committedNodes.forEach(nodeID => {
    const duration = snapshot.nodes.getIn([nodeID, 'actualDuration']);
    if (duration > 0) {
      maxDuration = Math.max(maxDuration, duration);
    }
  });

  const convertNodeToDatum = nodeID => {
    const node = snapshot.nodes.get(nodeID).toJSON();
    const renderedInCommit = snapshot.committedNodes.includes(nodeID);
    const name = node.name || 'Unknown';

    return {
      children: node.children
        ? (Array.isArray(node.children) ? node.children : [node.children])
          .filter(childID => snapshot.nodes.has(childID))
          .map(convertNodeToDatum)
        : [],
      id: node.id,
      name: name,
      tooltip: renderedInCommit
        ? `${name} (render time ${Math.round(node.actualDuration * 10) / 10}ms)`
        : name,
      value: node.treeBaseTime,
      color: renderedInCommit
        ? colors[Math.round((node.actualDuration / maxDuration) * (colors.length - 1))]
        : colors[0],
    };
  };

  return convertNodeToDatum(rootNodeID);
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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

  handleChange = event => this.setState({ selectedIndex: event.currentTarget.valueAsNumber });
  selectPrevious = event => this.setState(prevState => ({ selectedIndex: prevState.selectedIndex - 1 }));
  selectNext = event => this.setState(prevState => ({ selectedIndex: prevState.selectedIndex + 1 }));

  render() {
    const {snapshots, theme} = this.props;
    const {selectedIndex} = this.state;
    const selectedSnapshot = snapshots[selectedIndex];

    return (
      <React.Fragment>
        <div>
          <button disabled={selectedIndex === 0} onClick={this.selectPrevious}>prev</button>
          <input type="range" min={0} max={snapshots.length - 1} value={selectedIndex} onChange={this.handleChange} />
          <button disabled={selectedIndex === snapshots.length - 1} onClick={this.selectNext}>next</button>
        </div>
        <SnapshotView snapshot={selectedSnapshot} theme={theme} />
      </React.Fragment>
    );
  }
}

// TODO (bvaughn) Use something like AutoSizer to fill the viewport
const SnapshotView = ({snapshot, theme}) => {
  const rootNode = snapshot.nodes.get(snapshot.root);
  const children = rootNode.get('children');
  const rootNodeID = Array.isArray(children) ? children[0] : children;

  const data = convertSnapshotToChartData(snapshot, rootNodeID);

  return (
    <Flamegraph width={1000} height={400} data={data} />
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
