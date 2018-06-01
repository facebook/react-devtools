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

export type Profile = {
  actualDuration: number,
  baseTime: number,
  commitTime: number,
  fiberID: string,
  name: string,
  startTime: number,
};

export type FiberIDToProfilesMap = Map<string, Profile>;

export type Commit = {
  fiberToProfilesMap: FiberIDToProfilesMap,
  root: any,
};

export type Snapshot = {
  children: Array<Snapshot>,
  profile: Profile,
};
