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

import type {Commit} from './ProfilerTypes';
import type Bridge from '../../agent/Bridge';

var {EventEmitter} = require('events');

class Store extends EventEmitter {
  _bridge: Bridge;
  _mainStore: Object;

  isRecording: boolean = false;

  constructor(bridge: Bridge, mainStore: Object) {
    super();

    this._bridge = bridge;
    this._mainStore = mainStore;
  }

  off() {
    // Noop
  }

  setIsRecording(isRecording: boolean): void {
    this.isRecording = isRecording;
    this.emit('isRecording', isRecording);
    this._mainStore.setIsRecording(isRecording);
  }

  storeCommit(commit: Commit): void {
    // TODO Store
  }
}

module.exports = Store;
