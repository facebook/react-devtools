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

import type {Interaction, Snapshot} from '../ProfilerTypes';
import type {Theme} from '../../../frontend/types';

import memoize from 'memoize-one';
import React, { PureComponent } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { scale } from './constants';

const INTERACTION_SIZE = 4;
const ITEM_SIZE = 25;
const SNAPSHOT_SIZE = 10;

type SelectSnapshot = (snapshot: Snapshot) => void;

type ChartItem = {|
  interaction: Interaction,
  lastSnapshotCommitTime: number,
  snapshots: Array<Snapshot>,
|};

type ChartData = {|
  items: Array<ChartItem>,
  startTime: number,
  stopTime: number,
|};

type ItemData = {|
  chartData: ChartData,
  labelColumnWidth: number,
  graphColumnWidth: number,
  scaleX: (value: number) => number,
  selectedSnapshot: Snapshot,
  selectSnapshot: SelectSnapshot,
  theme: Theme,
|};

type Props = {|
  interactionsToSnapshots: Map<Interaction, Set<Snapshot>>,
  selectedSnapshot: Snapshot,
  selectSnapshot: SelectSnapshot,
  theme: Theme,
  timestampsToInteractions: Map<number, Set<Interaction>>,
|};

const InteractionTimeline = ({
  interactionsToSnapshots,
  selectedSnapshot,
  selectSnapshot,
  theme,
  timestampsToInteractions,
}: Props) => {
  // TODO (bvaughn) Cache data in ProfilerStore so we only have to compute it the first time
  const chartData = getChartData(
    interactionsToSnapshots,
    timestampsToInteractions,
  );

  return (
    <AutoSizer>
      {({ height, width }) => (
        <InteractionsList
          chartData={chartData}
          height={height}
          selectedSnapshot={selectedSnapshot}
          selectSnapshot={selectSnapshot}
          theme={theme}
          width={width}
        />
      )}
    </AutoSizer>
  );
};

type InteractionsListProps = {|
  chartData: ChartData,
  height: number,
  selectedSnapshot: Snapshot,
  selectSnapshot: SelectSnapshot,
  theme: Theme,
  width: number,
|};

const InteractionsList = ({
  chartData,
  height,
  selectedSnapshot,
  selectSnapshot,
  theme,
  width,
}: InteractionsListProps) => {
  // If a commit contains no interactions, display a fallback message.
  if (chartData.items.length === 0) {
    return (
      <div style={{
        height: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        No interactions were recorded for the current root.
      </div>
    );
  }

  // The following conversion methods are memoized,
  // So it's okay to call them on every render.
  const itemData = getItemData(
    chartData,
    selectedSnapshot,
    selectSnapshot,
    theme,
    width,
  );

  return (
    <List
      height={height}
      itemCount={chartData.items.length}
      itemData={itemData}
      itemSize={ITEM_SIZE}
      width={width}
    >
      {ListItem}
    </List>
  );
};

class ListItem extends PureComponent<any, void> {
  render() {
    const { data: itemData, index: itemIndex, style } = this.props;
    const { chartData, labelColumnWidth, scaleX, selectedSnapshot, theme } = itemData;
    const { items, startTime } = chartData;

    const item: ChartItem = items[itemIndex];
    const { interaction, lastSnapshotCommitTime } = item;

    // TODO Maybe wrap with <Fragment> instead of extra <div>
    // TODO Highlight current interaction and snapshot somehow
    // TODO Should we tight fit Interactions (like we currently do) or all Snapshots?
    return (
      <div style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: item.snapshots.includes(selectedSnapshot) ? theme.base01 : 'none',
        borderBottom: `1px solid ${theme.base01}`,
      }}>
        <div style={{
          width: labelColumnWidth,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: `${ITEM_SIZE}px`,
          boxSizing: 'border-box',
          padding: '0 0.25rem',
        }}>
          {interaction.name}
        </div>
        <div
          style={{
            position: 'absolute',
            left: `${labelColumnWidth + scaleX(interaction.timestamp)}px`,
            width: `${scaleX(startTime + lastSnapshotCommitTime - interaction.timestamp) + SNAPSHOT_SIZE}px`,
            height: `${INTERACTION_SIZE}px`,
            backgroundColor: theme.base03,
            borderRadius: '0.125rem',
          }}
        />
        {item.snapshots.map((snapshot, snapshotIndex) => (
          <div
            key={snapshotIndex}
            onClick={() => itemData.selectSnapshot(snapshot)}
            style={{
              position: 'absolute',
              left: `${labelColumnWidth + scaleX(snapshot.commitTime)}px`,
              width: `${SNAPSHOT_SIZE}px`,
              height: `${SNAPSHOT_SIZE}px`,
              borderRadius: `${SNAPSHOT_SIZE}px`,
              backgroundColor: selectedSnapshot === snapshot ? theme.state06 : theme.state00,
              cursor: 'pointer',
            }}
          />
        ))}
      </div>
    );
  }
}

const getChartData = memoize((
  interactionsToSnapshots: Map<Interaction, Set<Snapshot>>,
  timestampsToInteractions: Map<number, Set<Interaction>>,
): ChartData => {
  const items: Array<ChartItem> = [];
  let startTime: number = Number.MAX_VALUE;
  let stopTime: number = Number.MIN_VALUE;

  for (const [timestamp, interactions] of timestampsToInteractions) {
    for (const interaction of interactions) {
      const snapshots = Array.from(((interactionsToSnapshots.get(interaction): any): Set<Snapshot>));
      const lastSnapshotCommitTime = Math.max(stopTime, snapshots[snapshots.length - 1].commitTime);

      startTime = Math.min(startTime, timestamp);
      stopTime = lastSnapshotCommitTime;

      items.push({
        interaction,
        lastSnapshotCommitTime,
        snapshots,
      });
    }
  }

  return {
    items,
    startTime,
    stopTime,
  };
});

const getItemData = memoize((
  chartData: ChartData,
  selectedSnapshot: Snapshot,
  selectSnapshot: SelectSnapshot,
  theme: Theme,
  width: number,
): ItemData => {
  const labelColumnWidth = Math.min(200, width / 5);
  const graphColumnWidth = width - labelColumnWidth - SNAPSHOT_SIZE;

  return {
    chartData,
    graphColumnWidth,
    labelColumnWidth,
    scaleX: scale(chartData.startTime, chartData.stopTime, 0, graphColumnWidth),
    selectedSnapshot,
    selectSnapshot,
    theme,
  };
});

export default InteractionTimeline;
