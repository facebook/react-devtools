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
import type {Interaction, RootProfilerData, Snapshot} from './ProfilerTypes';

const {List} = require('immutable');
const {EventEmitter} = require('events');

class ProfilerStore extends EventEmitter {
  _bridge: Bridge;
  _mainStore: Object;

  cachedData = {};
  isRecording: boolean = false;
  rootsToProfilerData: Map<string, RootProfilerData> = new Map();
  roots: List = new List();
  selectedRoot: string | null = null;

  constructor(bridge: Bridge, mainStore: Object) {
    super();

    this._bridge = bridge;
    this._mainStore = mainStore;
    this._mainStore.on('clearSnapshots', this.clearSnapshots);
    this._mainStore.on('roots', this.saveRoots);
    this._mainStore.on('selected', this.updateSelected);
    this._mainStore.on('storeSnapshot', this.storeSnapshot);
  }

  off() {
    // Noop
  }

  cacheDataForSnapshot(snapshotIndex: number, snapshotRootID: string, key: string, data: any): void {
    this.cachedData[`${snapshotIndex}-${snapshotRootID}-${key}`] = data;
  }

  clearSnapshots = () => {
    this.cachedData = {};
    this.rootsToProfilerData = new Map();
    this.emit('profilerData', this.rootsToProfilerData);
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

  storeSnapshot = () => {
    const snapshot: Snapshot = {
      ...this._mainStore.snapshotData,
      nodes: this._mainStore._nodes,
    };

    const { root } = snapshot;
    if (!this.rootsToProfilerData.has(root)) {
      this.rootsToProfilerData.set(root, {
        interactionsToSnapshots: new Map(),
        snapshots: [],
        timestampsToInteractions: new Map(),
      });
    }

    const {interactionsToSnapshots, snapshots, timestampsToInteractions} =
      ((this.rootsToProfilerData.get(root): any): RootProfilerData);

    snapshots.push(snapshot);

    snapshot.memoizedInteractions.forEach((interaction: Interaction) => {
      if (interactionsToSnapshots.has(interaction)) {
        ((interactionsToSnapshots.get(interaction): any): Set<Snapshot>).add(snapshot);
      } else {
        interactionsToSnapshots.set(interaction, new Set([snapshot]));
      }

      if (timestampsToInteractions.has(interaction.timestamp)) {
        ((timestampsToInteractions.get(interaction.timestamp): any): Set<Interaction>).add(interaction);
      } else {
        timestampsToInteractions.set(interaction.timestamp, new Set([interaction]));
      }
    });

    this.emit('profilerData', this.rootsToProfilerData);
  };

  updateSelected = () => {
    let currentID = this._mainStore.selected;

    while (true) {
      const parentID = this._mainStore.getParent(currentID);
      if (parentID != null) {
        currentID = parentID;
      } else {
        break;
      }
    }

    this.selectedRoot = currentID;
    this.emit('selectedRoot', this.selectedRoot);
  };
}

module.exports = ProfilerStore;
