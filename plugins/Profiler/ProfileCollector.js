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

type Agent = any;

import type {StoreSnapshot} from './ProfilerTypes';

/**
 * The Profiler UI displays the entire React tree, with timing info, for each commit.
 * The frontend store only has the latest tree at any given time though,
 * So the ProfileCollector stores snapshots of the immutable tree for each commit,
 * Along with timing information for nodes that were updated in that commit.
 * This information is saved in the ProfilerStore.
 */
class ProfileCollector {
  _agent: Agent;
  _committedNodes: Array<string> = [];
  _isRecording: boolean = false;

  constructor(agent: Agent) {
    this._agent = agent;

    agent.on('isRecording', this._onIsRecording);
    agent.on('mount', this._onMountOrUpdate);
    agent.on('update', this._onMountOrUpdate);
    agent.on('rootCommitted', this._onRootCommitted);
  }

  _takeCommitSnapshotForRoot(root: string) {
    const storeSnapshot: StoreSnapshot = {
      committedNodes: this._committedNodes,
      commitTime: performance.now(),
      root,
    };

    this._agent.emit('storeSnapshot', storeSnapshot);
  }

  _onIsRecording = isRecording => {
    this._committedNodes = [];
    this._isRecording = isRecording;

    if (isRecording) {
      // Maybe in the future, we'll allow collecting multiple profiles and stepping through them.
      // For now, clear old snapshots when we start recording new data though.
      this._agent.emit('clearSnapshots');

      // Note that the Profiler doesn't need to do anything to turn profiling on in React.
      // Profiling-capable builds automatically profile all roots when DevTools is detected.
    }
  };

  _onMountOrUpdate = (data: any) => {
    if (!this._isRecording || data.actualDuration === undefined) {
      return;
    }

    this._committedNodes.push(data.id);
  };

  _onRootCommitted = (root: string) => {
    if (!this._isRecording) {
      return;
    }

    // Once all roots have been committed,
    // Take a snapshot of the current tree.
    this._takeCommitSnapshotForRoot(root);
    this._committedNodes = [];
  }
}

function init(agent: Agent): ProfileCollector {
  return new ProfileCollector(agent);
}

module.exports = {
  init,
};
