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

// How long the measurement should be presented for.
const DURATION = 500;

const MetaData = immutable.Record({
  expiration: 0,
  hit: 0,
});

class BananaSlugAbstractNodePresenter {
  constructor() {
    this._pool = new Map();
    this._drawing = false;
    this._clearTimer = 0;

    this._draw = this._draw.bind(this);
    this._redraw = this._redraw.bind(this);
  }

  present(measurement: Object): void {
    var data;
    if (this._pool.has(measurement)) {
      data = this._pool.get(measurement);
    } else {
      data = new MetaData();
    }

    data = data.merge({
      expiration: Date.now() + DURATION,
      hit: data.hit + 1,
    });

    this._pool.set(measurement, data);

    if (this._drawing) {
      return;
    }

    this._drawing = true;
    requestAnimationFrame(this._draw);
  }

  drawImpl(info: Object): void {
    // sub-class must implement this.
  }

  _redraw(): void {
    this._clearTimer = null;
    if (!this._drawing && this._pool.size > 0) {
      this._draw();
    }
  }

  _draw(): void {
    this._drawing = true;

    var now = Date.now();
    var pool = new Map();
    var minExpiration = Number.MAX_VALUE;

    for (let [measurement, data] of this._pool.entries()) {
      if (data.expiration < now) {
        // already passed the expiration time.
        this._pool.delete(measurement);
      } else {
        minExpiration = Math.min(data.expiration, minExpiration);
        pool.set(measurement, data);
      }
    }

    this.drawImpl(pool);

    if (pool.size > 0) {
      clearTimeout(this._clearTimer);
      this._clearTimer = setTimeout(this._redraw, minExpiration - now);
    }

    this._drawing = false;
  }
}

module.exports = BananaSlugAbstractNodePresenter;
