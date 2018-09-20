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

// http://gka.github.io/palettes/#colors=#37AFA9,#FEBC38|steps=10|bez=0|coL=0
export const gradient = [
  '#37afa9', '#63b19e', '#80b393', '#97b488', '#abb67d', '#beb771', '#cfb965', '#dfba57', '#efbb49', '#febc38',
];

export const didNotRender = '#ddd';

export const barHeight = 20;
export const barWidth = 100;
export const barWidthThreshold = 2;
export const minBarHeight = 5;
export const minBarWidth = 5;
export const textHeight = 18;

export const scale = (minValue: number, maxValue: number, minRange: number, maxRange: number) =>
  (value: number, fallbackValue: number) =>
    maxValue - minValue === 0
      ? fallbackValue
      : ((value - minValue) / (maxValue - minValue)) * (maxRange - minRange);

const gradientMaxIndex = gradient.length - 1;
export const getGradientColor = (value: number) => {
  let index;
  // Guard against commits with duration 0
  if (Number.isNaN(value)) {
    index = 0;
  } else if (!Number.isFinite(value)) {
    index = gradient.length - 1;
  } else {
    index = Math.max(0, Math.min(gradientMaxIndex, value)) * gradientMaxIndex;
  }
  return gradient[Math.round(index)];
};

export const formatDuration = (duration: number) => Math.round(duration * 10) / 10;
export const formatPercentage = (percentage: number) => Math.round(percentage * 100);
export const formatTime = (timestamp: number) => Math.round(Math.round(timestamp) / 100) / 10;

export const getMaxDuration = (snapshots: Array<Snapshot>): number =>
  snapshots.reduce((maxDuration: number, snapshot: Snapshot) =>
    Math.max(maxDuration, snapshot.duration || 0), 0);

type FilteredSnapshotData = {|
  snapshotIndex: number,
  snapshots: Array<Snapshot>,
|};

/**
 * Helper method to filter snapshots based on the current store state.
 * This is a helper util so that its calculations are memoized and shared between multiple components.
 */
export const getFilteredSnapshotData = memoize((
  commitThreshold: number,
  hideCommitsBelowThreshold: boolean,
  isInspectingSelectedFiber: boolean,
  selectedFiberID: string | null,
  selectedSnapshot: Snapshot,
  snapshotIndex: number,
  snapshots: Array<Snapshot>,
): FilteredSnapshotData => {
  let filteredSnapshots = snapshots;
  if (isInspectingSelectedFiber) {
    filteredSnapshots = filteredSnapshots.filter(snapshot => snapshot.committedNodes.includes(selectedFiberID));
  }
  if (hideCommitsBelowThreshold) {
    filteredSnapshots = filteredSnapshots.filter(snapshot => snapshot.duration >= commitThreshold);
  }

  const filteredSnapshotIndex = filteredSnapshots.indexOf(selectedSnapshot);

  return {
    snapshotIndex: filteredSnapshotIndex,
    snapshots: filteredSnapshots,
  };
});

export const calculateSelfDuration = (snapshot: Snapshot, nodeID: string): number => {
  const {nodes} = snapshot;
  const node = nodes.get(nodeID);
  const actualDuration = node.get('actualDuration');

  let selfDuration = actualDuration;

  const children = node.get('children');
  if (Array.isArray(children)) {
    children.forEach(childID => {
      const childActualDuration = nodes.getIn([childID, 'actualDuration']);
      if (childActualDuration > 0) {
        selfDuration -= childActualDuration;
      }
    });
  }

  return selfDuration;
};
