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

const {EventEmitter} = require('events');

class Store extends EventEmitter {
  _bridge: Bridge;
  _mainStore: Object;

  isRecording: boolean = false;
  snapshots: Array<Snapshot> = [];

  constructor(bridge: Bridge, mainStore: Object) {
    super();

    this._bridge = bridge;
    this._mainStore = mainStore;
    this._mainStore.on('clearSnapshots', () => this.clearSnapshots());
    this._mainStore.on('storeSnapshot', () => {
      this.snapshots.push({
        ...this._mainStore.snapshotData,
        nodes: mainStore._nodes, // TODO (bvaughn)
      });
      this.emit('snapshots', this.snapshots);
    });
  }

  off() {
    // Noop
  }

  clearSnapshots(): void {
    this.snapshots = [];
    this.emit('snapshots', this.snapshots);
  }

  setIsRecording(isRecording: boolean): void {
    this.isRecording = isRecording;
    this.emit('isRecording', isRecording);
    this._mainStore.setIsRecording(isRecording);
  }
}

module.exports = Store;
