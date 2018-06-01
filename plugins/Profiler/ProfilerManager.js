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

import type {Commit, FiberToProfilesMap, Profile, Snapshot} from './ProfilerTypes';

var {
  ASYNC_MODE_NUMBER,
  ASYNC_MODE_SYMBOL_STRING,
  CONTEXT_CONSUMER_NUMBER,
  CONTEXT_CONSUMER_SYMBOL_STRING,
  CONTEXT_PROVIDER_NUMBER,
  CONTEXT_PROVIDER_SYMBOL_STRING,
  FORWARD_REF_NUMBER,
  FORWARD_REF_SYMBOL_STRING,
  PROFILER_NUMBER,
  PROFILER_SYMBOL_STRING,
  STRICT_MODE_NUMBER,
  STRICT_MODE_SYMBOL_STRING,
  TIMEOUT_NUMBER,
  TIMEOUT_SYMBOL_STRING,
} = require('../../backend/ReactSymbols');

// TODO (bvaughn) Should this live in a shared constants file like ReactSymbols?
// Or should it be in a Fiber-specific file somewhere (like getData)?
const ProfileMode = 0b100;

// TODO (bvaughn) This entire implementation is coupled to Fiber.
// This will likely cause pain in a future version of React.
class ProfilerManager {
  _agent: Agent;
  _commits: Array<Commit> = [];
  _commitTime: number = 0;
  _fiberToProfilesMap: FiberToProfilesMap | null = null;
  _isRecording: boolean = false;

  constructor(agent: Agent) {
    this._agent = agent;

    agent.on('commitRoot', this._onCommitRoot);
    agent.on('isRecording', this._onIsRecording);
    agent.on('mount', this._onMountOrUpdate);
    agent.on('update', this._onMountOrUpdate);
  }

  _storeCurrentCommit() {
    if (this._fiberToProfilesMap !== null) {
      const mostRecentCommit = this._commits[this._commits.length - 1];
      const snapshot = this._createSnapshotTree(mostRecentCommit);
      // TODO (bvaughn) STORE: Save commit data in ProfilerStore.
      //TODO_DEBUG_crawlTree(mostRecentCommit.root.current);
      TODO_DEBUBG_printSnapshot(snapshot);
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

  _createSnapshotTree = (commit: Commit): Snapshot => {
    const profile = this._getOrCreateProfile(commit.root.current.child, commit);
    return this._populateSnapshotTree(profile.fiber, null, commit);
  };

  _getOrCreateProfile = (fiber: any, commit: Commit): Profile => {
    // TODO (bvaughn) This feels fishy.
    const profile = commit.fiberToProfilesMap.get(fiber) || commit.fiberToProfilesMap.get(fiber.alternate);
    if (profile) {
      return profile;
    } else {
      // TODO (bvaughn) It's unclear how (or if) we'll use this data.
      return {
        actualDuration: 0,
        baseTime: 0,
        commitTime: 0,
        fiber,
        name: getDisplayName(fiber),
        startTime: 0,
      };
    }
  };

  _populateSnapshotTree = (fiber: any, parentSnapsot: Snapshot | null, commit: Commit): Snapshot => {
    const snapshot: Snapshot = {
      children: [],
      profile: this._getOrCreateProfile(fiber, commit),
    };

    if (parentSnapsot !== null) {
      parentSnapsot.children.push(snapshot);
    }

    if (fiber.sibling) {
      this._populateSnapshotTree(fiber.sibling, parentSnapsot, commit);
    }
    if (fiber.child) {
      this._populateSnapshotTree(fiber.child, snapshot, commit);
    }

    return snapshot;
  };

  _onCommitRoot = rootID => {
    if (!this._isRecording) {
      return;
    }

    this._storeCurrentCommit();

    // This will not match the commit time logged to Profilers in this commit,
    // But that's probably okay.
    // DevTools only needs it to group all of the profile timings,
    // And to place them at a certain point in time in the replay view.
    this._commitTime = performance.now();
    this._fiberToProfilesMap = new Map();
    this._commits.push({
      fiberToProfilesMap: this._fiberToProfilesMap,
      root: this._agent.internalInstancesById.get(rootID),
    });
  };

  _onMountOrUpdate = (data: any) => {
    if (!this._isRecording || !data.profilerData) {
      return;
    }

    const fiber = this._agent.internalInstancesById.get(data.id);

    ((this._fiberToProfilesMap: any): FiberToProfilesMap).set(fiber, {
      actualDuration: data.profilerData.actualDuration,
      baseTime: data.profilerData.baseTime,
      commitTime: this._commitTime,
      fiber,
      name: data.name,
      startTime: data.profilerData.actualStartTime,
    });
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
      // TODO (bvaughn) STORE: Dump previous profiling session if we're starting a new one.
    } else {
      this._storeCurrentCommit();
      this._commits = [];
      this._fiberToProfilesMap = null;
    }
  };
}

function init(agent: Agent): ProfilerManager {
  return new ProfilerManager(agent);
}

module.exports = {
  init,
};

// TODO (bvaughn) This is redundant with getDataFiber() and should be shared with it.
const getDisplayName = (fiber: any): string => {
  const {type} = fiber;
  if (typeof type === 'function') {
    return type.displayName || type.name;
  }
  if (typeof type === 'string') {
    return type;
  }
  switch (type) {
    case ASYNC_MODE_NUMBER:
    case ASYNC_MODE_SYMBOL_STRING:
      return 'AsyncMode';
    case CONTEXT_CONSUMER_NUMBER:
    case CONTEXT_CONSUMER_SYMBOL_STRING:
      return 'Context.Consumer';
    case PROFILER_NUMBER:
    case PROFILER_SYMBOL_STRING:
      return `Profiler(${fiber.memoizedProps.id})`;
    case CONTEXT_PROVIDER_NUMBER:
    case CONTEXT_PROVIDER_SYMBOL_STRING:
      return 'Context.Provider';
    case STRICT_MODE_NUMBER:
    case STRICT_MODE_SYMBOL_STRING:
      return 'StrictMode';
    case TIMEOUT_NUMBER:
    case TIMEOUT_SYMBOL_STRING:
      return 'Timeout';
  }
  if (typeof type === 'object' && type !== null) {
    switch (type.$$typeof) {
      case FORWARD_REF_NUMBER:
      case FORWARD_REF_SYMBOL_STRING:
        const functionName = type.render.displayName || type.render.name || '';
        return functionName !== ''
          ? `ForwardRef(${functionName})`
          : 'ForwardRef';
    }
  }
  return 'Unknown';
};

const TODO_DEBUBG_printSnapshot = (snapshot: Snapshot, depth: number = 0): void => {
  if (depth === 0) {
    console.log('----- committed at', snapshot.profile.commitTime);
  }
  if (snapshot.profile.actualDuration > 0) {
    console.log('•'.repeat(depth), snapshot.profile.name, 'start:', snapshot.profile.startTime, 'duration:', snapshot.profile.actualDuration);
  } else {
    console.log('•'.repeat(depth), snapshot.profile.name);
  }
  
  snapshot.children.forEach(child => TODO_DEBUBG_printSnapshot(child, depth + 1));
};

const TODO_DEBUG_crawlTree = (fiber: any): void => {
  console.log(fiber.actualStartTime, '>', fiber.actualDuration, fiber);
  if (fiber.sibling) {
    TODO_DEBUG_crawlTree(fiber.sibling);
  }
  if (fiber.child) {
    TODO_DEBUG_crawlTree(fiber.child);
  }
};
