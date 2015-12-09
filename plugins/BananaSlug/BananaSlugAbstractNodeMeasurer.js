/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const requestAnimationFrame = require('fbjs/lib/requestAnimationFrame');
const immutable = require('immutable');

// How long the measurement can be cached in ms.
const DURATION = 800;

const {Record, Map, Set} = immutable;

const Measurement = Record({
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

class BananaSlugAbstractNodeMeasurer {
  constructor() {
    // pending nodes to measure.
    this._nodes = new Map();

    // ids of pending nodes.
    this._ids = new Map();

    // cached measurements.
    this._measurements = new Map();

    // callbacks for pending nodes.
    this._callbacks = new Map();

    this._queues = [];
    this._isRequesting = false;
    this._measureNodes = this._measureNodes.bind(this);
  }

  request(node, callback): string {
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
      return;
    }

    this._isRequesting = true;
    requestAnimationFrame(this._measureNodes);
  }

  measureImpl(node: any): void {
    // sub-class must implement this.
  }

  _measureNodes(): void {
    var results = new Map();
    var now = Date.now();

    results = results.withMutations(_results => {
      this._measurements = this._measurements.withMutations(_measurements => {
        for (let [node, requestID] of this._nodes.entries()) {
          let measurement = this._measureNode(now, node);
          // cache measurement.
          _measurements.set(node, measurement);
          _results.set(node, measurement);
        }
      });
    });

    // execute callbacks.
    for (let [node, measurement] of results.entries()) {
      this._callbacks.get(node).forEach(callback => callback(measurement));
    }

    // clear stale measurement.
    this._measurements = this._measurements.withMutations(_measurements => {
      for (let [node, measurement] of _measurements.entries()) {
        if (measurement.expiration < now) {
          _measurements.delete(node);
        }
      }
    });

    this._ids = new Map();
    this._nodes = new Map();
    this._callbacks = new Map();
    this._isRequesting = false;
  }

  _measureNode(timestamp: number, node: any): Measurement {
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
      measurement = new Measurement({
        ...data,
        expiration: timestamp + DURATION,
        id: 'measurement_' + String(_id++),
      });
    }
    return measurement;
  }
}

module.exports = BananaSlugAbstractNodeMeasurer;
