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

/** TODO (bvaughn)

The Profiler needs to display the entire React tree, with timing info, for each commit.
The frontend store only has the latest/current tree at any given time though,
So the profiler must either capture snapshots of this tree or be able to reconstruct it later.

It would be expensive to pass the entire tree (even as a map of IDs) across the bridge,
So instead, the ProfilerCollector gathers small actions (e.g. "mount", "update", or "unmount"),
That can be patched on top of an existing tree to represent an updated one.
These patches are then stored in batches (by commit) and used to reconstruct the tree at that time.

When the ProfilerCollector is started initially, it walks the current tree (for each root),
And initializes it using a series of "mount" actions.
Subsequent commits (with timing info) are patched on top of this initial tree.

When displaying each commit, the "tree base time" is used to determine the flame graph width,
And the "actual duration" is used to determine whether the component was re-rendered in that commit.
Because of this, we will also need to store this timing information for every node.
(In other words, we will need to send it along with every "mount" and "update" action.)

*/

// TODO (bvaughn) Should this live in a shared constants file like ReactSymbols?
// Or should it be in a Fiber-specific file somewhere (like getData)?
const ProfileMode = 0b100;

// TODO (bvaughn) This entire implementation is coupled to Fiber.
// This will likely cause pain in a future version of React.
class ProfilerCollector {
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

  // Deeply enables ProfileMode.
  // Newly inserted Fibers will inherit the mode,
  // But existing Fibers need to be explicitly activated.
  _enableProfileMode = fiber => {
    // Bailout if profiling is already enabled for the subtree.
    if (fiber.mode & ProfileMode) { // eslint-disable-line no-bitwise
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

    // TODO (bvaughn) We should force a re-render now somehow,
    // B'c there are no treeBaseTimes for existing Fibers that weren't profiling,
    // And this would mess up subsequent graphs.
    // Alternately we could update React to always collect timings if the DevTools hook is enabled.
  };

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
      // Maybe in the future, we'll allow collecting multiple profiles and stepping through them.
      // For now, clear old snapshots when we start recordig new data though.
      this._agent.emit('clearSnapshots');
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

function init(agent: Agent): ProfilerCollector {
  return new ProfilerCollector(agent);
}

module.exports = {
  init,
};
