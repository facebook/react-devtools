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

import type {CacheInteractionData, GetCachedInteractionData, Interaction, Snapshot} from '../ProfilerTypes';
import type {Theme} from '../../../frontend/types';

import memoize from 'memoize-one';
import React, { PureComponent } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { scale } from './constants';
import Hoverable from '../../../frontend/Hoverable';

const INTERACTION_SIZE = 4;
const ITEM_SIZE = 25;
const SNAPSHOT_SIZE = 10;

type SelectInteraction = (interaction: Interaction) => void;
type ViewSnapshot = (snapshot: Snapshot) => void;

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
  selectedInteraction: Interaction | null,
  selectedSnapshot: Snapshot,
  selectInteraction: SelectInteraction,
  theme: Theme,
  viewSnapshot: ViewSnapshot,
|};

type Props = {|
  cacheInteractionData: CacheInteractionData,
  getCachedInteractionData: GetCachedInteractionData,
  interactionsToSnapshots: Map<Interaction, Set<Snapshot>>,
  selectedInteraction: Interaction | null,
  selectedSnapshot: Snapshot,
  selectInteraction: SelectInteraction,
  theme: Theme,
  timestampsToInteractions: Map<number, Set<Interaction>>,
  viewSnapshot: ViewSnapshot,
|};

const InteractionTimeline = ({
  cacheInteractionData,
  getCachedInteractionData,
  interactionsToSnapshots,
  selectedInteraction,
  selectedSnapshot,
  selectInteraction,
  theme,
  timestampsToInteractions,
  viewSnapshot,
}: Props) => {
  // Cache data in ProfilerStore so we only have to compute it the first time the interactions tab is shown
  let chartData = getCachedInteractionData(selectedSnapshot.root);
  if (chartData === null) {
    chartData = getChartData(interactionsToSnapshots, timestampsToInteractions);
    cacheInteractionData(selectedSnapshot.root, chartData);
  }

  return (
    <AutoSizer>
      {({ height, width }) => (
        <InteractionsList
          chartData={((chartData: any): ChartData)}
          height={height}
          selectedInteraction={selectedInteraction}
          selectedSnapshot={selectedSnapshot}
          selectInteraction={selectInteraction}
          theme={theme}
          width={width}
          viewSnapshot={viewSnapshot}
        />
      )}
    </AutoSizer>
  );
};

type InteractionsListProps = {|
  chartData: ChartData,
  height: number,
  selectedInteraction: Interaction | null,
  selectedSnapshot: Snapshot,
  selectInteraction: SelectInteraction,
  theme: Theme,
  viewSnapshot: ViewSnapshot,
  width: number,
|};

const InteractionsList = ({
  chartData,
  height,
  selectedInteraction,
  selectedSnapshot,
  selectInteraction,
  theme,
  viewSnapshot,
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
    selectedInteraction,
    selectedSnapshot,
    selectInteraction,
    theme,
    viewSnapshot,
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
    const { chartData, labelColumnWidth, scaleX, selectedInteraction, selectedSnapshot, theme } = itemData;
    const { items, startTime } = chartData;

    const item: ChartItem = items[itemIndex];
    const { interaction, lastSnapshotCommitTime } = item;

    // TODO (bvaughn) Split selectInteraction (click) and viewSnapshot (double click) actions.

    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: selectedInteraction === interaction ? theme.base01 : 'transparent',
          borderBottom: `1px solid ${theme.base01}`,
        }}
      >
        <InteractionLink
          onClick={() => itemData.selectInteraction(interaction)}
          interaction={interaction}
          theme={theme}
          width={labelColumnWidth}
        />
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
            onClick={() => itemData.selectInteraction(interaction)}
            onDoubleClick={() => itemData.viewSnapshot(snapshot)}
            style={{
              position: 'absolute',
              left: `${labelColumnWidth + scaleX(snapshot.commitTime)}px`,
              width: `${SNAPSHOT_SIZE}px`,
              height: `${SNAPSHOT_SIZE}px`,
              borderRadius: `${SNAPSHOT_SIZE}px`,
              backgroundColor: selectedSnapshot === snapshot ? theme.state00 : theme.base00,
              border: `2px solid ${theme.state00}`,
              boxSizing: 'border-box',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>
    );
  }
}

const InteractionLink = Hoverable(
  ({ isHovered, interaction, onClick, onMouseEnter, onMouseLeave, theme, width }) => (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        width,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        lineHeight: `${ITEM_SIZE}px`,
        boxSizing: 'border-box',
        padding: '0 0.25rem',
        color: isHovered ? theme.state00 : theme.base05,
        textDecoration: isHovered ? 'underline' : 'none',
        cursor: 'pointer',
      }}
    >
      {interaction.name}
    </div>
  )
);

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
  selectedInteraction: Interaction | null,
  selectedSnapshot: Snapshot,
  selectInteraction: SelectInteraction,
  theme: Theme,
  viewSnapshot: ViewSnapshot,
  width: number,
): ItemData => {
  const labelColumnWidth = Math.min(200, width / 5);
  const graphColumnWidth = width - labelColumnWidth - SNAPSHOT_SIZE;

  return {
    chartData,
    graphColumnWidth,
    labelColumnWidth,
    scaleX: scale(chartData.startTime, chartData.stopTime, 0, graphColumnWidth),
    selectedInteraction,
    selectedSnapshot,
    selectInteraction,
    theme,
    viewSnapshot,
  };
});

export default InteractionTimeline;
