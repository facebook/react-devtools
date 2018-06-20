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

import type {Snapshot} from '../ProfilerTypes';
import type {Theme} from '../../../frontend/types';

const React = require('react');
const SnapshotFlamegraph = require('./SnapshotFlamegraph');
const RankedSnapshot = require('./RankedSnapshot');
const Hoverable = require('../../../frontend/Hoverable');
const Icons = require('../../../frontend/Icons');
const SvgIcon = require('../../../frontend/SvgIcon');

type Mode = 'flamegraph' | 'ranked';

type SnapshotProps = {
  snapshots: Array<Snapshot>,
  theme: Theme,
};
type SnapshotState = {
  selectedIndex: number,
  selectedMode: Mode,
};
class SnapshotsCollectionView extends React.Component<SnapshotProps, SnapshotState> {
  state: SnapshotState = {
    selectedIndex: 0,
    selectedMode: 'flamegraph',
  };

  handleChange = (event: SyntheticEvent<HTMLInputElement>) => this.setState({ selectedIndex: parseInt(event.currentTarget.value, 10) });
  selectPrevious = (event: SyntheticEvent<HTMLButtonElement>) => this.setState(prevState => ({ selectedIndex: prevState.selectedIndex - 1 }));
  selectNext = (event: SyntheticEvent<HTMLButtonElement>) => this.setState(prevState => ({ selectedIndex: prevState.selectedIndex + 1 }));

  render() {
    const {snapshots, theme} = this.props;
    const {selectedIndex, selectedMode} = this.state;
    const selectedSnapshot = snapshots[selectedIndex];

    const SelectedChartComponent = selectedMode === 'flamegraph'
      ? SnapshotFlamegraph
      : RankedSnapshot;

    return (
      <div style={styles.Main}>
        <div style={styles.TopNav}>
          <div>
            <label style={styles.ModeRadioOption}>
              <input
                type="radio"
                checked={selectedMode === 'flamegraph'}
                onChange={() => this.setState({ selectedMode: 'flamegraph' })}
              /> Flamegraph
            </label>
            <label style={styles.ModeRadioOption}>
            <input
              type="radio"
              checked={selectedMode === 'ranked'}
              onChange={() => this.setState({ selectedMode: 'ranked' })}
            /> Ranked
            </label>
          </div>
          <div style={styles.SnapshotSliderOptions}>
            Commits: <BackButton
              disabled={selectedIndex === 0}
              onClick={this.selectPrevious}
              theme={theme}
            />
            <input
              type="range"
              min={0}
              max={snapshots.length - 1}
              value={selectedIndex}
              onChange={this.handleChange}
            />
            <ForwardButton
              disabled={selectedIndex === snapshots.length - 1}
              onClick={this.selectNext}
              theme={theme}
            />
          </div>
        </div>
        <div style={styles.ChartingArea}>
          <SelectedChartComponent snapshot={selectedSnapshot} theme={theme} />
        </div>
      </div>
    );
  }
}

const BackButton = Hoverable(
  ({ disabled, isActive, isHovered, onClick, onMouseEnter, onMouseLeave, theme }) => (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={clearButtonStyle(isActive, isHovered, theme)}
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
      style={clearButtonStyle(isActive, isHovered, theme)}
      title="Clear profiling data"
    >
      <SvgIcon path={Icons.FORWARD} />
    </button>
  )
);

const clearButtonStyle = (isActive: boolean, isHovered: boolean, theme: Theme) => ({
  background: 'none',
  border: 'none',
  outline: 'none',
  cursor: 'pointer',
  color: isHovered ? theme.state06 : 'inherit',
  padding: '4px 8px',
});

const styles = {
  Main: {
    flex: 1,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem',
    boxSizing: 'border-box',
  },
  TopNav: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: '0.5rem',
  },
  ModeRadioOption: {
    marginRight: '0.5rem',
  },
  SnapshotSliderOptions: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  ChartingArea: {
    flex: 1,
    width: '100%',
  },
};

module.exports = SnapshotsCollectionView;
