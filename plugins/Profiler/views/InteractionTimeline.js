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
import NoInteractionsMessage from './NoInteractionsMessage';
import { scale } from './constants';

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
  hasMultipleRoots: boolean,
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
  hasMultipleRoots,
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
          hasMultipleRoots={hasMultipleRoots}
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
  hasMultipleRoots: boolean,
  height: number,
  selectedInteraction: Interaction | null,
  selectedSnapshot: Snapshot,
  selectInteraction: SelectInteraction,
  theme: Theme,
  viewSnapshot: ViewSnapshot,
  width: number,
|};

class InteractionsList extends PureComponent<InteractionsListProps, void> {
  handleKeyDown = event => {
    if (event.keyCode === UP_ARROW || event.keyCode === DOWN_ARROW) {
      // Don't let the main Elements tab change root selection for keyboard arrows.
      event.preventDefault();

      const {
        chartData,
        selectedInteraction,
        selectInteraction,
      } = this.props;

      const items = chartData.items;
      const index = items.findIndex(({ interaction }) => selectedInteraction === interaction);

      // Select a new interaction...
      let newIndex = 0;
      if (event.keyCode === UP_ARROW) {
        newIndex = index > 0
          ? index - 1
          : items.length - 1;
      } else {
        newIndex = index < items.length - 1
          ? index + 1
          : 0;
      }

      selectInteraction(items[newIndex].interaction);
    }
  };

  render() {
    const {
      chartData,
      hasMultipleRoots,
      height,
      selectedInteraction,
      selectedSnapshot,
      selectInteraction,
      theme,
      viewSnapshot,
      width,
    } = this.props;

    // If a commit contains no interactions, display a fallback message.
    if (chartData.items.length === 0) {
      return (
        <NoInteractionsMessage
          hasMultipleRoots={hasMultipleRoots}
          height={height}
          width={width}
        />
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
      <div
        onKeyDown={this.handleKeyDown}
        style={{
          outline: 'none',
          height,
          width,
        }}
        tabIndex={0}
      >
        <List
          height={height}
          itemCount={chartData.items.length}
          itemData={itemData}
          itemSize={ITEM_SIZE}
          width={width}
        >
          {ListItem}
        </List>
      </div>
    );
  }
}

const UP_ARROW = 38;
const DOWN_ARROW = 40;

type ListItemProps = {|
  data: ItemData,
  index: number,
  style: Object,
|};
type ListItemState = {|
  isHovered: boolean,
  hoveredSnapshot: Snapshot | null,
|};

class ListItem extends PureComponent<ListItemProps, ListItemState> {
  state = {
    isHovered: false,
    hoveredSnapshot: null,
  };

  handleMouseEnter = (snapshot: Snapshot | null) => this.setState({
    isHovered: true,
    hoveredSnapshot: snapshot,
  });

  handleMouseLeave = () => this.setState({isHovered: false});

  render() {
    const { data: itemData, index: itemIndex, style } = this.props;
    const { isHovered, hoveredSnapshot } = this.state;

    const { chartData, labelColumnWidth, scaleX, selectedInteraction, selectedSnapshot, theme } = itemData;
    const { items } = chartData;

    const item: ChartItem = items[itemIndex];
    const { interaction, lastSnapshotCommitTime } = item;

    const showRowHover = isHovered && hoveredSnapshot === null;

    return (
      <div
        onClick={() => itemData.selectInteraction(interaction)}
        onMouseEnter={() => this.handleMouseEnter(null)}
        onMouseLeave={this.handleMouseLeave}
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: showRowHover ? theme.state03 : (selectedInteraction === interaction ? theme.base01 : 'transparent'),
          borderBottom: `1px solid ${theme.base01}`,
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: labelColumnWidth,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: `${ITEM_SIZE}px`,
            boxSizing: 'border-box',
            padding: '0 0.25rem',
            color: showRowHover ? theme.state00 : theme.base05,
            textDecoration: showRowHover ? 'underline' : 'none',
            userSelect: 'none',
          }}
          title={interaction.name}
        >
          {interaction.name}
        </div>
        <div
          style={{
            position: 'absolute',
            left: `${labelColumnWidth + scaleX(interaction.timestamp)}px`,
            width: `${scaleX(lastSnapshotCommitTime - interaction.timestamp) + SNAPSHOT_SIZE}px`,
            height: `${INTERACTION_SIZE}px`,
            backgroundColor: theme.base03,
            borderRadius: '0.125rem',
          }}
        />
        {item.snapshots.map((snapshot, snapshotIndex) => (
          <div
            key={snapshotIndex}
            onClick={() => itemData.viewSnapshot(snapshot)}
            onMouseEnter={() => this.handleMouseEnter(snapshot)}
            onMouseLeave={() => this.handleMouseEnter(null)}
            style={{
              position: 'absolute',
              left: `${labelColumnWidth + scaleX(snapshot.commitTime)}px`,
              width: `${SNAPSHOT_SIZE}px`,
              height: `${SNAPSHOT_SIZE}px`,
              borderRadius: `${SNAPSHOT_SIZE}px`,
              backgroundColor: hoveredSnapshot === snapshot || selectedSnapshot === snapshot ? theme.state00 : theme.base00,
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

const getChartData = memoize((
  interactionsToSnapshots: Map<Interaction, Set<Snapshot>>,
  timestampsToInteractions: Map<number, Set<Interaction>>,
): ChartData => {
  const items: Array<ChartItem> = [];
  let stopTime = Number.MIN_VALUE;

  // eslint-disable-next-line no-unused-vars
  for (const [timestamp, interactions] of timestampsToInteractions) {
    for (const interaction of interactions) {
      const snapshots = Array.from(((interactionsToSnapshots.get(interaction): any): Set<Snapshot>));
      const lastSnapshotCommitTime = snapshots[snapshots.length - 1].commitTime;

      stopTime = Math.max(stopTime, lastSnapshotCommitTime);

      items.push({
        interaction,
        lastSnapshotCommitTime,
        snapshots,
      });
    }
  }

  return {
    items,
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
    scaleX: scale(0, chartData.stopTime, 0, graphColumnWidth),
    selectedInteraction,
    selectedSnapshot,
    selectInteraction,
    theme,
    viewSnapshot,
  };
});

export default InteractionTimeline;
