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

const React = require('react');
const SnapshotView = require('./SnapshotView');

type SnapshotProps = {
  snapshots: Array<Snapshot>,
};
type SnapshotState = {
  selectedIndex: number
};
class SnapshotsCollectionView extends React.Component<SnapshotProps, SnapshotState> {
  state: SnapshotState = {
    selectedIndex: 0,
  };

  handleChange = (event: SyntheticEvent<HTMLInputElement>) => this.setState({ selectedIndex: parseInt(event.currentTarget.value, 10) });
  selectPrevious = (event: SyntheticEvent<HTMLButtonElement>) => this.setState(prevState => ({ selectedIndex: prevState.selectedIndex - 1 }));
  selectNext = (event: SyntheticEvent<HTMLButtonElement>) => this.setState(prevState => ({ selectedIndex: prevState.selectedIndex + 1 }));

  render() {
    const {snapshots} = this.props;
    const {selectedIndex} = this.state;
    const selectedSnapshot = snapshots[selectedIndex];

    return (
      <div style={styles.Snapshots}>
        <div style={styles.SnapshotNavButtons}>
          <button disabled={selectedIndex === 0} onClick={this.selectPrevious}>prev</button>
          <input type="range" min={0} max={snapshots.length - 1} value={selectedIndex} onChange={this.handleChange} />
          <button disabled={selectedIndex === snapshots.length - 1} onClick={this.selectNext}>next</button>
        </div>
        <div style={styles.Snapshot}>
          <SnapshotView snapshot={selectedSnapshot} />
        </div>
      </div>
    );
  }
}

const styles = {
  Snapshots: {
    flex: 1,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem',
    boxSizing: 'border-box',
  },
  SnapshotNavButtons: {
    marginBottom: '0.5rem',
  },
  Snapshot: {
    flex: 1,
    width: '100%',
  },
};

module.exports = SnapshotsCollectionView;
