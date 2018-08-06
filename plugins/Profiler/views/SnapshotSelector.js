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
|};

export default ({
  disabled,
  selectedSnapshot,
  selectSnapshot,
  snapshots,
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

// TODO (bvaughn) Use disabled prop

const SnapshotSelector = ({
  disabled,
  height,
  selectedSnapshot,
  selectSnapshot,
  snapshots,
  width,
}: SnapshotSelectorProps) => {
  const listData = getListData(snapshots, width);

  // Pass required contextual data down to the ListItem renderer.
  // (This method is memoized so it's safe to call on every render.)
  const itemData = getItemData(
    listData.maxDuration,
    selectSnapshot,
    selectedSnapshot,
    snapshots,
  );

  return (
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
  );
};

class ListItem extends PureComponent<any, void> {
  render() {
    const { index, style } = this.props;
    const itemData: ItemData = ((this.props.data: any): ItemData);

    const { maxDuration, selectedSnapshot, selectSnapshot, snapshots } = itemData;

    const snapshot = snapshots[index];
    const percentage = snapshot.duration / maxDuration;
    const isSelected = selectedSnapshot === snapshot;

    return (
      <div
        onClick={() => selectSnapshot(snapshot)}
        style={{
          ...style,
          opacity: isSelected ? 0.5 : 1,
          cursor: isSelected ? 'default' : 'pointer',
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
  maxDuration: number,
  selectSnapshot: SelectSnapshot,
  selectedSnapshot: Snapshot,
  snapshots: Array<Snapshot>,
): ItemData => ({
  maxDuration,
  selectSnapshot,
  selectedSnapshot,
  snapshots,
}));
