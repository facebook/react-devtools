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

const {Map} = require('immutable');

export type Snapshot = {|
  committedNodes: Array<string>,
  commitTime: number,
  nodes: Map,
  root: string,
|};

export type StoreSnapshot = {|
  committedNodes: Array<string>,
  commitTime: number,
  root: string,
|};
