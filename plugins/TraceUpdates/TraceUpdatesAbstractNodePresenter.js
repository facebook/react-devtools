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

const immutable = require('immutable');
const requestAnimationFrame = require('fbjs/lib/requestAnimationFrame');

import type {
  Measurement,
  MetaData as MetaDataType,
  Presenter,
} from './TraceUpdatesTypes';

// How long the measurement should be presented for.
const DURATION = 250;

const {Record, Map} = immutable;

const MetaData: MetaDataType = Record({
  expiration: 0,
  hit: 0,
});

class TraceUpdatesAbstractNodePresenter implements Presenter {
  // eslint shouldn't error on type positions. TODO: update eslint
  // eslint-disable-next-line no-undef
  _clearTimer: ?TimeoutID;
  _draw: () => void;
  _drawing: boolean;
  _enabled: boolean;
  _pool: Map<Measurement, MetaDataType>;
  _redraw: () => void;

  constructor() {
    this._pool = new Map();
    this._drawing = false;
    this._enabled = false;
    this._clearTimer = null;

    this._draw = this._draw.bind(this);
    this._redraw = this._redraw.bind(this);
  }

  present(measurement: Measurement): void {
    if (!this._enabled) {
      return;
    }
    var data;
    if (this._pool.has(measurement)) {
      data = this._pool.get(measurement);
    } else {
      // $FlowIssue
      data = new MetaData();
    }

    data = data.merge({
      expiration: Date.now() + DURATION,
      hit: data.hit + 1,
    });

    this._pool = this._pool.set(measurement, data);

    if (this._drawing) {
      return;
    }

    this._drawing = true;
    requestAnimationFrame(this._draw);
  }

  setEnabled(enabled: boolean): void {
    // console.log('setEnabled', enabled);
    if (this._enabled === enabled) {
      return;
    }

    this._enabled = enabled;

    if (enabled) {
      return;
    }

    if (this._clearTimer) {
      clearTimeout(this._clearTimer);
      this._clearTimer = null;
    }

    this._pool = this._pool.clear();
    this._drawing = false;
    this.clearImpl();
  }

  drawImpl(measurements: Map<Measurement, MetaDataType>): void {
    // sub-class should implement this.
  }

  clearImpl(): void {
    // sub-class should implement this.
  }

  _redraw(): void {
    this._clearTimer = null;
    if (!this._drawing && this._pool.size > 0) {
      this._drawing = true;
      this._draw();
    }
  }

  _draw(): void {
    if (!this._enabled) {
      this._drawing = false;
      return;
    }

    var now = Date.now();
    var minExpiration = Number.MAX_VALUE;

    this._pool = this._pool.withMutations(_pool => {
      for (const [measurement, data] of _pool.entries()) {
        if (data.expiration < now) {
          // already passed the expiration time.
          _pool.delete(measurement);
        } else {
          minExpiration = Math.min(data.expiration, minExpiration);
        }
      }
    });

    this.drawImpl(this._pool);

    if (this._pool.size > 0) {
      if (this._clearTimer != null) {
        clearTimeout(this._clearTimer);
      }
      this._clearTimer = setTimeout(this._redraw, minExpiration - now);
    }

    this._drawing = false;
  }
}

module.exports = TraceUpdatesAbstractNodePresenter;
