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
import { getGradientColor, minBarHeight, minBarWidth } from './constants';

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
|};

type Props = {|
  disabled: boolean,
  selectedSnapshot: Snapshot,
  selectSnapshot: SelectSnapshot,
  snapshots: Array<Snapshot>,
  theme: Theme,
|};

export default ({
  disabled,
  selectedSnapshot,
  selectSnapshot,
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
            snapshots={snapshots}
            width={width}
          />
        )}
      </AutoSizer>
    </div>
  );
};

type SnapshotSelectorProps = {|
  disabled: boolean,
  height: number,
  selectedSnapshot: Snapshot,
  selectSnapshot: SelectSnapshot,
  snapshots: Array<Snapshot>,
  width: number,
|};

type SnapshotSelectorState = {|
  isMouseDown: boolean,
|};

class SnapshotSelector extends PureComponent<SnapshotSelectorProps, SnapshotSelectorState> {
  state: SnapshotSelectorState = {
    isMouseDown: false,
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
    );

    return (
      <div
        onMouseDown={this.handleMouseDown}
        onMouseLeave={this.handleMouseLeave}
        onMouseUp={this.handleMouseUp}
        style={{height, width}}
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

    const { disabled, maxDuration, selectedSnapshot, selectSnapshot, snapshots } = itemData;

    const snapshot = snapshots[index];
    const percentage = snapshot.duration / maxDuration;
    const isSelected = selectedSnapshot === snapshot;

    return (
      <div
        onClick={disabled ? undefined : () => selectSnapshot(snapshot)}
        onMouseEnter={disabled ? undefined : this.handleMouseEnter}
        style={{
          ...style,
          opacity: isSelected || disabled ? 0.5 : 1,
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 1,
          height: Math.max(minBarHeight, percentage * HEIGHT),
          backgroundColor: getGradientColor(percentage),
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
): ItemData => ({
  disabled,
  isMouseDown,
  maxDuration,
  selectSnapshot,
  selectedSnapshot,
  snapshots,
}));
