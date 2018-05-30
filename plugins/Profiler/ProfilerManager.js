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

type Snapshot = {
  actualDuration: number,
  actualStartTime: number,
  baseTime: number,
  commitTime: number,
  name: string,
};

// TODO (bvaughn) Should this live in a shared constants file like ReactSymbols?
// Or should it be in a Fiber-specific file somewhere (like getData)?
const ProfileMode = 0b100;

class ProfilerManager {
  _agent: Agent;
  _commitTime: number = 0;
  _isRecording: boolean = false;
  _snapshots: {[commitTime: number]: Array<Snapshot>} = {};

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

    if (this._isRecording) {
      this._snapshots[this._commitTime] = [];
    }
  };

  _onMountOrUpdate = (data: any) => {
    if (!this._isRecording || !data.profilerData) {
      return;
    }

    // TODO (bvaughn) Do I need to capture hierarchical information as well?
    // So the resulting flame graph can mirror the tree structure somehow?
    // Or do we want to always sort by most expensive to least expensive?
    this._snapshots[this._commitTime].push({
      actualDuration: data.profilerData.actualDuration,
      actualStartTime: data.profilerData.actualStartTime,
      baseTime: data.profilerData.baseTime,
      commitTime: this._commitTime, // TODO (bvaughn) This is redundant. Maybe ditch it?
      name: data.name,
    });
  };

  // Deeply enables ProfileMode.
  // Newly inserted Fibers will inherit the mode,
  // But existing Fibers need to be explicitly activated.
  _enableProfileMode = fiber => {
    // eslint-disable-next-line no-bitwise
    if (fiber.mode & ProfileMode) {
      // Bailout if profiling is already enabled for the subtree.
      return;
    }

    fiber.mode |= ProfileMode; // eslint-disable-line no-bitwise
    if (fiber.alternate !== null) {
      fiber.alternate.mode |= ProfileMode; // eslint-disable-line no-bitwise
    }

    if (fiber.child !== null) {
      this._enableProfileMode(fiber.child);
    }
    if (fiber.sibling !== null) {
      this._enableProfileMode(fiber.sibling);
    }
  };

  _onIsRecording = isRecording => {
    this._isRecording = isRecording;

    // Flip ProfilerMode on or off for each tree.
    // This instructs React to collect profiling data for the tree.
    // Once profiling is enabled, we just leave it one (for simplicity).
    // This way we don't risk turning it off for <Profiler> Fibers.
    if (isRecording) {
      this._agent.roots.forEach(id => {
        this._enableProfileMode(this._agent.internalInstancesById.get(id));
      });
    }

    // Dump snapshot data if we are done profiling.
    if (!isRecording) {
      console.log(this._snapshots); // TODO (bvaughn) Debugging only; remove this.
      this._snapshots = {};
    }
  };
}

function init(agent: Agent): ProfilerManager {
  return new ProfilerManager(agent);
}

module.exports = {
  init,
};
