/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const BananaSlugUtils = require('./BananaSlugUtils');
const Map = require('fbjs/lib/Map');
const requestAnimationFrame = require('fbjs/lib/requestAnimationFrame');

var _id = 1;

class BananaSlugAbstractNodeMeasurer {
  constructor() {
    this._nodes = new Map();
    this._ids = new Map();
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
      this._nodes.delete(node);
      this._callbacks.delete(node);
    }
  }

  __measureImpl(node: any): void {
    // sub-class must implement this.
  }

  _measureNodes(): void {
    var results = new Map();

    for (let [node, requestID] of this._nodes.entries()) {
      this._nodes.delete(node);
      this._ids.delete(requestID);
      results.set(node, this.__measureImpl(node));
    }


    for (let [node, info] of results.entries()) {
      this._callbacks.get(node).forEach(callback => callback(info));
      this._callbacks.delete(node);
    }

    this._isRequesting = false;
  }
}

module.exports = BananaSlugAbstractNodeMeasurer;
