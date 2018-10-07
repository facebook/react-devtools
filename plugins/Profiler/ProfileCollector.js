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

import type {Interaction, StoreSnapshot} from './ProfilerTypes';

const hasNativePerformanceNow =
  typeof performance === 'object' &&
  typeof performance.now === 'function';

const now = hasNativePerformanceNow
  ? () => performance.now()
  : () => Date.now();

/**
 * The Profiler UI displays the entire React tree, with timing info, for each commit.
 * The frontend store only has the latest tree at any given time though,
 * So the ProfileCollector stores snapshots of the immutable tree for each commit,
 * Along with timing information for nodes that were updated in that commit.
 * This information is saved in the ProfilerStore.
 */
class ProfileCollector {
  _agent: Agent;
  _committedNodes: Set<string> = new Set();
  _isRecording: boolean = false;
  _maxActualDuration: number = 0;
  _recordingStartTime: number = 0;

  constructor(agent: Agent) {
    this._agent = agent;

    agent.on('isRecording', this._onIsRecording);
    agent.on('mount', this._onMountOrUpdate);
    agent.on('rootCommitted', this._onRootCommitted);
    agent.on('unmount', this._onUnmount);
    agent.on('update', this._onMountOrUpdate);
  }

  _takeCommitSnapshotForRoot(id: string, data: any) {
    const interactionsArray = data.memoizedInteractions != null
      ? Array.from(data.memoizedInteractions)
      : [];

    // Map interaction start times to when we started profiling.
    // We clone (rather than mutate) the interactions in stateNode.memoizedInteractions,
    // Because we don't want to affect user code that might be consuming these Interactions via Profiler.
    const memoizedInteractions = interactionsArray.map(({name, timestamp}: Interaction) => ({
      name,
      timestamp: timestamp - this._recordingStartTime,
    }));

    const storeSnapshot: StoreSnapshot = {
      memoizedInteractions,
      committedNodes: Array.from(this._committedNodes),
      commitTime: now() - this._recordingStartTime,
      duration: this._maxActualDuration,
      root: id,
    };

    this._agent.emit('storeSnapshot', storeSnapshot);
  }

  _onIsRecording = isRecording => {
    this._committedNodes = new Set();
    this._isRecording = isRecording;
    this._recordingStartTime = isRecording ? now() : 0;

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

    this._committedNodes.add(data.id);
    this._maxActualDuration = Math.max(this._maxActualDuration, data.actualDuration);
  };

  _onRootCommitted = (id: string, internalInstance: any, data: any) => {
    if (!this._isRecording) {
      return;
    }

    // Once all roots have been committed,
    // Take a snapshot of the current tree.
    this._takeCommitSnapshotForRoot(id, data);

    // Then reset data for the next snapshot.
    this._committedNodes = new Set();
    this._maxActualDuration = 0;
  }

  _onUnmount = (id: string) => {
    this._committedNodes.delete(id);
  };
}

function init(agent: Agent): ProfileCollector {
  return new ProfileCollector(agent);
}

module.exports = {
  init,
};
