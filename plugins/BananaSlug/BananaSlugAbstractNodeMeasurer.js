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

const Measurement = immutable.Record({
  id: '',
  bottom: 0,
  expiration: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0,
});

var _id = 1;

class BananaSlugAbstractNodeMeasurer {
  constructor() {
    this._nodes = new Map();
    this._ids = new Map();
    this._measurements = new Map();
    this._callbacks = new Map();

    this._queues = [];
    this._isRequesting = false;
    this._measureNodes = this._measureNodes.bind(this);
  }

  request(node, callback): string {
    var requestID = this._nodes.has(node) ?
      this._nodes.get(node) :
      String(_id++);

    this._nodes.set(node, requestID);
    this._ids.set(requestID, node);

    if (this._callbacks.has(node)) {
      this._callbacks.get(node).add(callback);
    } else {
      this._callbacks.set(node, new Set([callback]));
    }

    if (this._isRequesting) {
      return;
    }

    this._isRequesting = true;
    requestAnimationFrame(this._measureNodes);
  }

  cancel(id: string): void {
    if (this._ids.has(id)) {
      var node = this._ids.get(id);
      this._ids.delete(id);
      this._callbacks.delete(node);
      this._measurements.delete(node);
      this._nodes.delete(node);
    }
  }

  measureImpl(node: any): void {
    // sub-class must implement this.
  }

  _measureNodes(): void {
    var results = new Map();
    var now = Date.now();

    for (let [node, requestID] of this._nodes.entries()) {
      this._nodes.delete(node);
      this._ids.delete(requestID);
      results.set(node, this._measureNode(now, node));
    }

    for (let [node, info] of results.entries()) {
      // execute callbacks.
      this._callbacks.get(node).forEach(callback => callback(info));
      this._callbacks.delete(node);
    }

    for (let [node, measurement] of this._measurements.entries()) {
      if (measurement.expiration < now) {
        // clear stale measurement.
        this._measurements.delete(node);
      }
    }

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


    this._measurements.set(node, measurement);
    return measurement;
  }
}

module.exports = BananaSlugAbstractNodeMeasurer;
