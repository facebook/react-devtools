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

const getDisplayName = require('../../backend/getDisplayName');

type Agent = any;

type Snapshot = {
  actualDuration: number,
  actualStartTime: number,
  baseTime: number,
  fiber: any,
  name: string,
};

type FiberToSnapshotMap = Map<any, Snapshot>;

type Commit = {
  commitTime: number,
  fiberToSnapshotMap: FiberToSnapshotMap,
  root: any,
};

// TODO (bvaughn) Should this live in a shared constants file like ReactSymbols?
// Or should it be in a Fiber-specific file somewhere (like getData)?
const ProfileMode = 0b100;

// TODO (bvaughn) This entire implementation is coupled to Fiber.
// This will likely cause pain in a future version of React.
class ProfilerManager {
  _agent: Agent;
  _commits: Array<Commit> = [];
  _fiberToSnapshotMap: FiberToSnapshotMap | null = null;
  _isRecording: boolean = false;

  constructor(agent: Agent) {
    this._agent = agent;

    agent.on('commitRoot', this._onCommitRoot);
    agent.on('isRecording', this._onIsRecording);
    agent.on('mount', this._onMountOrUpdate);
    agent.on('update', this._onMountOrUpdate);
  }

  _onCommitRoot = rootID => {
    if (!this._isRecording) {
      return;
    }

    // This will not match the commit time logged to Profilers in this commit,
    // But that's probably okay.
    // DevTools only needs it to group all of the profile timings,
    // And to place them at a certain point in time in the replay view.
    const commitTime = performance.now();

    this._fiberToSnapshotMap = new Map();
    this._commits.push({
      commitTime,
      fiberToSnapshotMap: this._fiberToSnapshotMap,
      root: this._agent.internalInstancesById.get(rootID),
    });
  };

  _onMountOrUpdate = (data: any) => {
    if (!this._isRecording || !data.profilerData) {
      return;
    }

    const fiber = this._agent.internalInstancesById.get(data.id);

    // TODO (bvaughn) Do I need to capture hierarchical information as well?
    // So the resulting flame graph can mirror the tree structure somehow?
    // Or do we want to always sort by most expensive to least expensive?
    ((this._fiberToSnapshotMap: any): FiberToSnapshotMap).set(fiber, {
      actualDuration: data.profilerData.actualDuration,
      actualStartTime: data.profilerData.actualStartTime,
      baseTime: data.profilerData.baseTime,
      fiber,
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
      // TODO (bvaughn) Debugging only; remove this...
      const commit = this._commits[this._commits.length - 1];
      printSnapshotTree(commit.root.current.child, commit);
      // TODO (bvaughn) Debugging only; remove this^^^

      this._commits = [];
      this._fiberToSnapshotMap = null;
    }
  };
}

function init(agent: Agent): ProfilerManager {
  return new ProfilerManager(agent);
}

module.exports = {
  init,
};

// TODO (bvaughn) Debugging only; remove this...
const printSnapshotTree = (fiber, commit, depth = 0) => {
  // TODO (bvaughn) This is hacky; it's because I'm doing root.current.
  const snapshot = commit.fiberToSnapshotMap.get(fiber) || commit.fiberToSnapshotMap.get(fiber.alternate);

  if (snapshot) {
    console.log('••'.repeat(depth), snapshot.name, (commit.fiberToSnapshotMap.has(fiber) ? '(fiber)' : '(alternate)'), 'duration:', snapshot.actualDuration);
  } else {
    console.log('••'.repeat(depth), getDisplayName(fiber));
  }

  if (fiber.sibling) {
    printSnapshotTree(fiber.sibling, commit, depth);
  }
  if (fiber.child) {
    printSnapshotTree(fiber.child, commit, depth + 1);
  }
};
// TODO (bvaughn) Debugging only; remove this^^^
