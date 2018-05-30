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

class ProfilerManager {
  _agent: Agent;
  _commitTime: number = 0;
  _isRecording: boolean = false;

  constructor(agent: Agent) {
    this._agent = agent;

    agent.on('commitRoot', this._onCommitRoot);
    agent.on('isRecording', this._onIsRecording);
    agent.on('mount', this._onMountOrUpdate);
    agent.on('update', this._onMountOrUpdate);
  }

  _onCommitRoot = id => {
    // This will not match the commit time logged to Profilers in this commit,
    // But that's probably okay.
    // DevTools only needs it to group all of the profile timings,
    // And to place them at a certain point in time in the replay view.
    this._commitTime = performance.now();
  };

  _onMountOrUpdate = (data: any) => {
    if (!this._isRecording || !data.profilerData) {
      return;
    }

    // TODO If we're in profiling mode, loop through events and take snapsot.
  }

  _onIsRecording = isRecording => {
    this._isRecording = isRecording;

    if (!isRecording) {
      // TODO: Dump previous data if we
    }
  };
}

function init(agent: Agent): ProfilerManager {
  return new ProfilerManager(agent);
}

module.exports = {
  init,
};
