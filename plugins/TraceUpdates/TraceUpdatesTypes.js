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

export type Agent = any;

export type Node = any;

export type Measurement = {
  bottom: number,
  expiration: number,
  height: number,
  id: string,
  left: number,
  right: number,
  scrollX: number,
  scrollY: number,
  top: number,
  width: number,
};

export type onMeasureNode = (m: Measurement) => void;

export type Measurer = {
  request:(n: Node, c: onMeasureNode) => string,
};

export type Presenter = {
  present: (m: Measurement) => void,
  setEnabled: (b: boolean) => void,
};
