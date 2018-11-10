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

const {Map} = require('immutable');

export type ChartType = 'flamegraph' | 'interactions' | 'ranked';

export type CacheDataForSnapshot = (
  snapshotIndex: number,
  snapshotRootID: string,
  key: string,
  data: any,
) => void;

export type CacheInteractionData = (
  rootID: string,
  data: any,
) => void;

export type GetCachedDataForSnapshot = (
  snapshotIndex: number,
  snapshotRootID: string,
  key: string,
) => any | null;

export type GetCachedInteractionData = (
  rootID: string,
) => any | null;

export type Interaction = {|
  name: string,
  timestamp: number,
|};

export type RootProfilerData = {|
  interactionsToSnapshots: Map<Interaction, Set<Snapshot>>,
  snapshots: Array<Snapshot>,
  timestampsToInteractions: Map<number, Set<Interaction>>,
|};

export type Snapshot = {|
  committedNodes: Array<string>,
  commitTime: number,
  duration: number,
  memoizedInteractions: Array<Interaction>,
  nodes: Map,
  root: string,
|};

export type StoreSnapshot = {|
  committedNodes: Array<string>,
  commitTime: number,
  duration: number,
  memoizedInteractions: Array<Interaction>,
  root: string,
|};
