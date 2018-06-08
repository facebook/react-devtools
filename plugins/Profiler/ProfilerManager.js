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

import type {FiberIDToProfiles, Profile} from './ProfilerTypes';

// TODO (bvaughn) Should this live in a shared constants file like ReactSymbols?
// Or should it be in a Fiber-specific file somewhere (like getData)?
const ProfileMode = 0b100;

// TODO (bvaughn) This entire implementation is coupled to Fiber.
// This will likely cause pain in a future version of React.
class ProfilerManager {
  _agent: Agent;
  _commitTime: number = 0;
  _fiberIDToProfilesMap: FiberIDToProfiles = {};
  _lastFiberID: string | null = null;
  _isRecording: boolean = false;

  constructor(agent: Agent) {
    this._agent = agent;

    agent.on('commitRoot', this._onCommitRoot);
    agent.on('isRecording', this._onIsRecording);
    agent.on('mount', this._onMountOrUpdate);
    agent.on('update', this._onMountOrUpdate);
  }

  _storeCurrentCommit(test) {
    if (this._lastFiberID !== null) {
      this._fiberIDToProfilesMap.ROOT = this._fiberIDToProfilesMap[((this._lastFiberID: any): string)];
      this._agent.emit('storeSnapshot', this._fiberIDToProfilesMap);
    }
  }

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

  _onCommitRoot = rootID => {
    if (!this._isRecording) {
      return;
    }

    this._storeCurrentCommit(true);

    // This will not match the commit time logged to Profilers in this commit,
    // But that's probably okay.
    // DevTools only needs it to group all of the profile timings,
    // And to place them at a certain point in time in the replay view.
    this._commitTime = performance.now();
    this._fiberIDToProfilesMap = {};
    this._lastFiberID = null;
  };

  _onMountOrUpdate = (data: any) => {
    if (!this._isRecording || !data.profilerData) {
      return;
    }

    // TODO Store info in a typed array to later, lazily re-construct the full tree for each commit.
    // This will need to handle the fact that conditional rendering may dramatically alter the tree over time.
    const profile: Profile = {
      actualDuration: data.profilerData.actualDuration,
      baseTime: data.profilerData.baseTime,
      childIDs: [],
      commitTime: this._commitTime,
      fiberID: data.id,
      name: data.name,
      startTime: data.profilerData.actualStartTime,
    };

    const fiber = this._agent.internalInstancesById.get(data.id);
    let child = fiber.child;
    while (child !== null) {
      const childID = this._agent.idsByInternalInstances.get(child);
      if (this._fiberIDToProfilesMap[childID]) {
        profile.childIDs.push(childID);
      }
      child = child.sibling;
    }

    this._lastFiberID = data.id;
    this._fiberIDToProfilesMap[data.id] = profile;
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

    if (isRecording) {
      this._agent.emit('clearSnapshots');
    } else {
      this._storeCurrentCommit(false);
      this._fiberIDToProfilesMap = {};
      this._lastFiberID = null;
    }
  };
}

function init(agent: Agent): ProfilerManager {
  return new ProfilerManager(agent);
}

module.exports = {
  init,
};
