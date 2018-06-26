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

import type Bridge from '../../agent/Bridge';
import type {Snapshot} from './ProfilerTypes';

const {List} = require('immutable');
const {EventEmitter} = require('events');

class ProfilerStore extends EventEmitter {
  _bridge: Bridge;
  _mainStore: Object;

  cachedData = {};
  isRecording: boolean = false;
  roots: List = new List();
  snapshots: Array<Snapshot> = [];

  constructor(bridge: Bridge, mainStore: Object) {
    super();

    this._bridge = bridge;
    this._mainStore = mainStore;
    this._mainStore.on('clearSnapshots', this.clearSnapshots);
    this._mainStore.on('roots', this.saveRoots);
    this._mainStore.on('storeSnapshot', this.storeSnapsnot);
  }

  off() {
    // Noop
  }

  cacheDataForSnapshot(snapshotIndex: number, snapshotRootID: string, key: string, data: any): void {
    this.cachedData[`${snapshotIndex}-${snapshotRootID}-${key}`] = data;
  }

  clearSnapshots = () => {
    this.snapshots = [];
    this.cachedData = {};
    this.emit('snapshots', this.snapshots);
  };

  getCachedDataForSnapshot(snapshotIndex: number, snapshotRootID: string, key: string): any {
    return this.cachedData[`${snapshotIndex}-${snapshotRootID}-${key}`] || null;
  }

  saveRoots = () => {
    this.roots = this._mainStore.roots;
    this.emit('roots', this._mainStore.roots);
  };

  setIsRecording(isRecording: boolean): void {
    this.isRecording = isRecording;
    this.emit('isRecording', isRecording);
    this._mainStore.setIsRecording(isRecording);
  }

  storeSnapsnot = () => {
    // TODO (bvaughn) The Store nodes Map may not be accurate!
    // Nodes that were not re-rendered might have their alternates in the tree.
    // I think the only way to handle this is to re-crawl the tree from a known committed Fiber...
    this.snapshots.push({
      ...this._mainStore.snapshotData,
      nodes: this._mainStore._nodes, // TODO (bvaughn)
    });
    this.emit('snapshots', this.snapshots);
  };
}

module.exports = ProfilerStore;
