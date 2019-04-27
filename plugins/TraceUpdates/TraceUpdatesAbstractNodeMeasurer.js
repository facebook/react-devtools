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

const requestAnimationFrame = require('fbjs/lib/requestAnimationFrame');
const immutable = require('immutable');

import type {Measurement, Measurer} from './TraceUpdatesTypes';

// How long the measurement can be cached in ms.
const DURATION = 800;

const {Record, Map, Set} = immutable;

const MeasurementRecord = Record({
  bottom: 0,
  expiration: 0,
  height: 0,
  id: '',
  left: 0,
  right: 0,
  scrollX: 0,
  scrollY: 0,
  top: 0,
  width: 0,
});

var _id = 100;

class TraceUpdatesAbstractNodeMeasurer implements Measurer {
  _callbacks: Map<Node, (v: Measurement) => void>;
  _ids: Map<string, Node>;
  _isRequesting: boolean;
  _measureNodes: () => void;
  _measurements: Map<Node, Measurement>;
  _nodes: Map<string, Node>;

  constructor() {
    // pending nodes to measure.
    this._nodes = new Map();

    // ids of pending nodes.
    this._ids = new Map();

    // cached measurements.
    this._measurements = new Map();

    // callbacks for pending nodes.
    this._callbacks = new Map();

    this._isRequesting = false;

    // non-auto-binds.
    this._measureNodes = this._measureNodes.bind(this);
  }

  request(node: Node, callback: (v: Measurement) => void): string {
    var requestID = this._nodes.has(node) ?
      this._nodes.get(node) :
      String(_id++);

    this._nodes = this._nodes.set(node, requestID);
    this._ids = this._ids.set(requestID, node);

    var callbacks = this._callbacks.has(node) ?
      this._callbacks.get(node) :
      new Set();

    callbacks = callbacks.add(callback);
    this._callbacks = this._callbacks.set(node, callbacks);

    if (this._isRequesting) {
      return requestID;
    }

    this._isRequesting = true;
    requestAnimationFrame(this._measureNodes);
    return requestID;
  }

  cancel(requestID: string): void {
    if (this._ids.has(requestID)) {
      var node = this._ids.get(requestID);
      this._ids = this._ids.delete(requestID);
      this._nodes = this._nodes.delete(node);
      this._callbacks = this._callbacks.delete(node);
    }
  }

  measureImpl(node: Node): Measurement {
    // sub-class must overwrite this.
    return new MeasurementRecord();
  }

  _measureNodes(): void {
    var now = Date.now();

    this._measurements = this._measurements.withMutations(_measurements => {
      for (const node of this._nodes.keys()) {
        const measurement = this._measureNode(now, node);
        // cache measurement.
        _measurements.set(node, measurement);
      }
    });

    // execute callbacks.
    for (const node of this._nodes.keys()) {
      const measurement = this._measurements.get(node);
      this._callbacks.get(node).forEach(callback => callback(measurement));
    }

    // clear stale measurement.
    this._measurements = this._measurements.withMutations(_measurements => {
      for (const [node, measurement] of _measurements.entries()) {
        if (measurement.expiration < now) {
          _measurements.delete(node);
        }
      }
    });

    this._ids = this._ids.clear();
    this._nodes = this._nodes.clear();
    this._callbacks = this._callbacks.clear();
    this._isRequesting = false;
  }

  _measureNode(timestamp: number, node: Node): Measurement {
    var measurement;
    var data;

    if (this._measurements.has(node)) {
      measurement = this._measurements.get(node);
      if (measurement.expiration < timestamp) {
        // measurement expires. measure again.
        data = this.measureImpl(node);
        measurement = measurement.merge({
          ...data,
          expiration: timestamp + DURATION,
        });
      }
    } else {
      data = this.measureImpl(node);
      measurement = new MeasurementRecord({
        ...data,
        expiration: timestamp + DURATION,
        id: 'm_' + String(_id++),
      });
    }
    return measurement;
  }
}

module.exports = TraceUpdatesAbstractNodeMeasurer;
