/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const BananaSlugAbstractNodePresenter = require('./BananaSlugAbstractNodePresenter');

const OUTLINE_COLOR = '#f0f0f0';

const COLORS = [
  // coolest
  '#55cef6',
  '#55f67b',
  '#a5f655',
  '#f4f655',
  '#f6a555',
  '#f66855',
  // hottest
  '#ff0000'
];

const HOTTEST_COLOR = COLORS[COLORS.length - 1];

function drawBorder(ctx, measurement, borderWidth, borderColor) {
  // outline
  ctx.lineWidth = 1;
  ctx.strokeStyle = OUTLINE_COLOR;

  ctx.strokeRect(
    measurement.left- 1,
    measurement.top - 1,
    measurement.width + 2,
    measurement.height + 2
  );

  // inset
  ctx.lineWidth = 1;
  ctx.strokeStyle = OUTLINE_COLOR;
  ctx.strokeRect(
    measurement.left + borderWidth,
    measurement.top + borderWidth,
    measurement.width - borderWidth ,
    measurement.height - borderWidth
  );
  ctx.strokeStyle = borderColor;


  if (measurement.should_update) {
    ctx.setLineDash([2]);
  } else {
    ctx.setLineDash([0]);
  }

  // border
  ctx.lineWidth = '' + borderWidth;
  ctx.strokeRect(
    measurement.left + Math.floor(borderWidth / 2),
    measurement.top + Math.floor(borderWidth / 2),
    measurement.width - borderWidth,
    measurement.height - borderWidth,
  );

  ctx.setLineDash([0]);
}

class BananaSlugWebNodePresenter extends BananaSlugAbstractNodePresenter {
  constructor() {
    super();
    this._canvas = null;
  }

  drawImpl(pool: Set): void {
    this._ensureCanvas();
    var canvas = this._canvas;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );
    for (let [measurement, data] of pool.entries()) {
      let color = COLORS[data.hit - 1] || HOTTEST_COLOR;
      drawBorder(ctx, measurement, 1, color);
    }
  }

  _ensureCanvas(): void {
    if (this._canvas !== null) {
      return;
    }
    var node = window.document.createElement('canvas');
    node.width = window.screen.availWidth;
    node.height = window.screen.availHeight;
    node.style.cssText = `
      x-background-color: red;
      x-opacity: 0.1;
      bottom: 0;
      left: 0;
      pointer-events: none;
      position: fixed;
      right: 0;
      top: 0;
      z-index: 1000000000;
    `;
    var root = window.document.documentElement;
    root.insertBefore(node, root.firstChild);
    this._canvas = node;
  }
}

module.exports = BananaSlugWebNodePresenter;
