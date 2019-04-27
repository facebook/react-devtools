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

import memoize from 'memoize-one';
import React, {PureComponent} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';
import {
  didNotRender,
  formatDuration,
  formatTime,
  getGradientColor,
  getFilteredSnapshotData,
  minBarHeight,
  minBarWidth,
} from './constants';
import Icons from '../../../frontend/Icons';
import IconButton from './IconButton';

const HEIGHT = 20;

type SelectSnapshot = (snapshot: Snapshot) => void;

type ListData = {|
  itemSize: number,
  maxDuration: number,
|};

type ItemData = {|
  isMouseDown: boolean,
  maxDuration: number,
  selectSnapshot: SelectSnapshot,
  selectedSnapshot: Snapshot,
  snapshots: Array<Snapshot>,
  theme: Theme,
|};

type Props = {|
  commitThreshold: number,
  hideCommitsBelowThreshold: boolean,
  isInspectingSelectedFiber: boolean,
  selectedFiberID: string | null,
  selectedSnapshot: Snapshot,
  selectSnapshot: SelectSnapshot,
  snapshotIndex: number,
  snapshots: Array<Snapshot>,
  theme: Theme,
|};

export default ({
  commitThreshold,
  hideCommitsBelowThreshold,
  isInspectingSelectedFiber,
  selectedFiberID,
  selectedSnapshot,
  selectSnapshot,
  snapshotIndex,
  snapshots,
  theme,
}: Props) => {
  const filteredData = getFilteredSnapshotData(
    commitThreshold,
    hideCommitsBelowThreshold,
    isInspectingSelectedFiber,
    selectedFiberID,
    selectedSnapshot,
    snapshotIndex,
    snapshots,
  );

  return (
    <SnapshotSelectorWrapper
      commitThreshold={commitThreshold}
      hideCommitsBelowThreshold={hideCommitsBelowThreshold}
      isInspectingSelectedFiber={isInspectingSelectedFiber}
      selectedFiberID={selectedFiberID}
      selectedSnapshot={selectedSnapshot}
      selectSnapshot={selectSnapshot}
      snapshotIndex={filteredData.snapshotIndex}
      snapshots={filteredData.snapshots}
      theme={theme}
    />
  );
};

class SnapshotSelectorWrapper extends PureComponent<Props, void> {
  handleKeyDown = event => {
    if (event.keyCode === LEFT_ARROW || event.keyCode === RIGHT_ARROW) {
      event.preventDefault();

      if (event.keyCode === LEFT_ARROW) {
        this.selectPreviousSnapshotIndex();
      } else {
        this.selectNextSnapshotIndex();
      }
    }
  };

  selectNextSnapshotIndex = () => {
    const {
      selectSnapshot,
      snapshotIndex,
      snapshots,
    } = this.props;

    if (
      snapshots.length > 0 &&
      snapshotIndex < snapshots.length - 1
    ) {
      const newIndex = snapshotIndex + 1;
      selectSnapshot(snapshots[newIndex]);
    }
  };

  selectPreviousSnapshotIndex = () => {
    const {
      selectSnapshot,
      snapshotIndex,
      snapshots,
    } = this.props;

    if (
      snapshots.length > 0 &&
      snapshotIndex > 0
    ) {
      const newIndex = snapshotIndex - 1;
      selectSnapshot(snapshots[newIndex]);
    }
  };

  render() {
    const {
      commitThreshold,
      hideCommitsBelowThreshold,
      isInspectingSelectedFiber,
      selectedFiberID,
      selectedSnapshot,
      selectSnapshot,
      snapshotIndex,
      snapshots,
      theme,
    } = this.props;

    const numSnapshots = snapshots.length;

    return (
      <div
        onKeyDown={this.handleKeyDown}
        style={{
          display: 'flex',
          flex: '1 0 auto',
          alignItems: 'center',
          outline: 'none',
        }}
        tabIndex={0}
      >
        {numSnapshots === 0 && (
          <span style={{whiteSpace: 'nowrap'}}>
            0 / 0
          </span>
        )}
        {numSnapshots > 0 && (
          <span style={{whiteSpace: 'nowrap'}}>
            {`${snapshotIndex >= 0 ? snapshotIndex + 1 : '-'}`.padStart(`${numSnapshots}`.length, '0')} / {numSnapshots}
          </span>
        )}
        <IconButton
          disabled={snapshotIndex <= 0}
          icon={Icons.BACK}
          isTransparent={true}
          onClick={this.selectPreviousSnapshotIndex}
          theme={theme}
          title="Previous render"
        />
        <AutoSizedSnapshotSelector
          commitThreshold={commitThreshold}
          hideCommitsBelowThreshold={hideCommitsBelowThreshold}
          isInspectingSelectedFiber={isInspectingSelectedFiber}
          selectedFiberID={selectedFiberID}
          selectedSnapshot={selectedSnapshot}
          selectSnapshot={selectSnapshot}
          snapshotIndex={snapshotIndex}
          snapshots={snapshots}
          theme={theme}
        />
        <IconButton
          disabled={numSnapshots === 0 || snapshotIndex >= numSnapshots - 1}
          icon={Icons.FORWARD}
          isTransparent={true}
          onClick={this.selectNextSnapshotIndex}
          theme={theme}
          title="Next render"
        />
      </div>
    );
  }
}

const AutoSizedSnapshotSelector = ({
  isInspectingSelectedFiber,
  selectedFiberID,
  selectedSnapshot,
  selectSnapshot,
  snapshotIndex,
  snapshots,
  theme,
}: Props) => (
  <div style={{
    flex: '1 1 100px',
    height: HEIGHT,
    display: 'grid',
    alignitems: 'flex-end',
    gridGap: '1px',
    gridAutoFlow: 'column',
    backgroundColor: theme.base00,
  }}>
    <AutoSizer disableHeight={true}>
      {({ height, width }) => (
        <SnapshotSelector
          height={HEIGHT}
          selectedFiberID={selectedFiberID}
          selectedSnapshot={selectedSnapshot}
          selectSnapshot={selectSnapshot}
          snapshotIndex={snapshotIndex}
          snapshots={snapshots}
          theme={theme}
          width={width}
        />
      )}
    </AutoSizer>
  </div>
);

const LEFT_ARROW = 37;
const RIGHT_ARROW = 39;

type SnapshotSelectorProps = {|
  height: number,
  selectedFiberID: string | null,
  selectedSnapshot: Snapshot,
  selectSnapshot: SelectSnapshot,
  snapshotIndex: number,
  snapshots: Array<Snapshot>,
  theme: Theme,
  width: number,
|};

type SnapshotSelectorState = {|
  isMouseDown: boolean,
|};

class SnapshotSelector extends PureComponent<SnapshotSelectorProps, SnapshotSelectorState> {
  // $FlowFixMe createRef()
  listRef = React.createRef();

  state: SnapshotSelectorState = {
    isMouseDown: false,
  };

  componentDidUpdate(prevProps) {
    // Make sure any newly selected snapshot is visible within the list.
    if (
      this.props.snapshotIndex !== prevProps.snapshotIndex &&
      this.listRef.current !== null
    ) {
      this.listRef.current.scrollToItem(this.props.snapshotIndex);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('mouseup', this.handleMouseUp);
  }

  handleMouseDown = event => this.setState({ isMouseDown: true }, () => {
    window.addEventListener('mouseup', this.handleMouseUp);
  });
  handleMouseUp = event => this.setState({ isMouseDown: false });

  render() {
    const {
      height,
      selectedSnapshot,
      selectSnapshot,
      snapshots,
      theme,
      width,
    } = this.props;
    const {isMouseDown} = this.state;

    const listData = getListData(snapshots, width);

    // Pass required contextual data down to the ListItem renderer.
    // (This method is memoized so it's safe to call on every render.)
    const itemData = getItemData(
      isMouseDown,
      listData.maxDuration,
      selectSnapshot,
      selectedSnapshot,
      snapshots,
      theme,
    );

    const numSnapshots = snapshots.length;

    return (
      <div
        onMouseDown={this.handleMouseDown}
        onMouseUp={this.handleMouseUp}
        style={{ height, width }}
      >
        {numSnapshots > 0 && (
          <List
            direction="horizontal"
            height={height}
            itemCount={snapshots.length}
            itemData={itemData}
            itemSize={listData.itemSize}
            ref={this.listRef}
            width={width}
          >
            {ListItem}
          </List>
        )}
      </div>
    );
  }
}

class ListItem extends PureComponent<any, void> {
  handleMouseEnter = () => {
    const itemData: ItemData = ((this.props.data: any): ItemData);
    if (itemData.isMouseDown) {
      itemData.selectSnapshot(itemData.snapshots[this.props.index]);
    }
  }

  render() {
    const { index, style } = this.props;
    const itemData: ItemData = ((this.props.data: any): ItemData);

    const {
      maxDuration,
      selectedSnapshot,
      selectSnapshot,
      snapshots,
      theme,
    } = itemData;

    const snapshot = snapshots[index];
    // Guard against commits with duration 0
    const percentage = Math.min(1, Math.max(0, snapshot.duration / maxDuration)) || 0;
    const isSelected = selectedSnapshot === snapshot;

    const width = parseFloat(style.width) - 1;

    return (
      <div
        onClick={() => selectSnapshot(snapshot)}
        onMouseEnter={this.handleMouseEnter}
        style={{
          ...style,
          width,
          backgroundColor: isSelected ? theme.base01 : 'transparent',
          userSelect: 'none',
          cursor: 'pointer',
        }}
        title={`Duration ${formatDuration(snapshot.duration)}ms at ${formatTime(snapshot.commitTime)}s`}
      >
        <div style={{
          position: 'absolute',
          bottom: 0,
          width,
          height: Math.max(minBarHeight, percentage * HEIGHT),
          backgroundColor: isSelected
            ? theme.state06
            : percentage === 0
              ? didNotRender
              : getGradientColor(percentage),
        }} />
      </div>
    );
  }
}

const getListData = memoize((
  snapshots: Array<Snapshot>,
  width: number,
): ListData => ({
  itemSize: Math.max(minBarWidth, width / snapshots.length),
  maxDuration: snapshots.reduce((maxDuration, snapshot) => Math.max(maxDuration, snapshot.duration), 0),
}));

const getItemData = memoize((
  isMouseDown: boolean,
  maxDuration: number,
  selectSnapshot: SelectSnapshot,
  selectedSnapshot: Snapshot,
  snapshots: Array<Snapshot>,
  theme: Theme,
): ItemData => ({
  isMouseDown,
  maxDuration,
  selectSnapshot,
  selectedSnapshot,
  snapshots,
  theme,
}));
