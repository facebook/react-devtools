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
import { didNotRender, formatDuration, formatTime, getGradientColor, minBarHeight, minBarWidth } from './constants';

const HEIGHT = 20;

type SelectSnapshot = (snapshot: Snapshot) => void;

type ListData = {|
  itemSize: number,
  maxDuration: number,
|};

type ItemData = {|
  disabled: boolean,
  isMouseDown: boolean,
  maxDuration: number,
  selectSnapshot: SelectSnapshot,
  selectedSnapshot: Snapshot,
  snapshots: Array<Snapshot>,
  theme: Theme,
|};

type Props = {|
  disabled: boolean,
  selectedSnapshot: Snapshot,
  selectSnapshot: SelectSnapshot,
  snapshotIndex: number,
  snapshots: Array<Snapshot>,
  theme: Theme,
|};

export default ({
  disabled,
  selectedSnapshot,
  selectSnapshot,
  snapshotIndex,
  snapshots,
  theme,
}: Props) => {
  return (
    <div style={{
      flex: '1 1 100px',
      maxWidth: 250,
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
            disabled={disabled}
            height={HEIGHT}
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
};

const LEFT_ARROW = 37;
const RIGHT_ARROW = 39;

type SnapshotSelectorProps = {|
  disabled: boolean,
  height: number,
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
  state: SnapshotSelectorState = {
    isMouseDown: false,
  };

  handleKeyDown = event => {
    const {
      disabled,
      snapshotIndex,
      selectSnapshot,
      snapshots,
    } = this.props;

    if (disabled) {
      return;
    }

    if (event.keyCode === LEFT_ARROW || event.keyCode === RIGHT_ARROW) {
      event.preventDefault();

      let newIndex = 0;
      if (event.keyCode === LEFT_ARROW) {
        newIndex = snapshotIndex > 0
          ? snapshotIndex - 1
          : snapshots.length - 1;
      } else {
        newIndex = snapshotIndex < snapshots.length - 1
          ? snapshotIndex + 1
          : 0;
      }

      selectSnapshot(snapshots[newIndex]);
    }
  };

  handleMouseDown = event => this.setState({ isMouseDown: true });
  handleMouseLeave = event => this.setState({ isMouseDown: false });
  handleMouseUp = event => this.setState({ isMouseDown: false });

  render() {
    const {
      disabled,
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
      disabled,
      isMouseDown,
      listData.maxDuration,
      selectSnapshot,
      selectedSnapshot,
      snapshots,
      theme,
    );

    return (
      <div
        onKeyDown={this.handleKeyDown}
        onMouseDown={this.handleMouseDown}
        onMouseLeave={this.handleMouseLeave}
        onMouseUp={this.handleMouseUp}
        style={{
          height,
          width,
          outline: '0',
        }}
        tabIndex={0}
      >
        <List
          direction="horizontal"
          height={height}
          itemCount={snapshots.length}
          itemData={itemData}
          itemSize={listData.itemSize}
          width={width}
        >
          {ListItem}
        </List>
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

    const { disabled, maxDuration, selectedSnapshot, selectSnapshot, snapshots, theme } = itemData;

    const snapshot = snapshots[index];
    // Guard against commits with duration 0
    const percentage = Math.min(1, Math.max(0, snapshot.duration / maxDuration)) || 0;
    const isSelected = selectedSnapshot === snapshot;

    const width = parseFloat(style.width) - 1;

    return (
      <div
        onClick={disabled ? undefined : () => selectSnapshot(snapshot)}
        onMouseEnter={disabled ? undefined : this.handleMouseEnter}
        style={{
          ...style,
          width,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'default' : 'pointer',
          userSelect: 'none',
          backgroundColor: isSelected ? theme.base01 : 'transparent',
        }}
        title={`Duration ${formatDuration(snapshot.duration)}ms at ${formatTime(snapshot.commitTime)}s`}
      >
        <div style={{
          position: 'absolute',
          bottom: 0,
          width,
          height: Math.max(minBarHeight, percentage * HEIGHT),
          backgroundColor: isSelected
            ? theme.state00
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
  disabled: boolean,
  isMouseDown: boolean,
  maxDuration: number,
  selectSnapshot: SelectSnapshot,
  selectedSnapshot: Snapshot,
  snapshots: Array<Snapshot>,
  theme: Theme,
): ItemData => ({
  disabled,
  isMouseDown,
  maxDuration,
  selectSnapshot,
  selectedSnapshot,
  snapshots,
  theme,
}));
