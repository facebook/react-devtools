/**
 * The Presenter file.
 */

var UserDefaultSetting = require('../share/UserDefaultSetting');

var {
  document,
  requestAnimationFrame,
  window,
} = global;

var DURATION = 500;
var OUTLINE_COLOR = '#f0f0f0';
var COLORS = [
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

var LAST_COLOR = COLORS[COLORS.length - 1];

var _canvas;
var _queue = {};
var _isPainting = false;
var _enabled = UserDefaultSetting.isDefaultEnabled();

/**
 * @param {boolean} value
 */
function setEnabled(value) {
  if (value === _enabled) {
    return;
  }

  UserDefaultSetting.setDefaultEnabled(value);

  _enabled = value;

  if (!_canvas) {
    return;
  }

  _queue = {};

  if (_enabled) {
    // paint the icon.
    paintImmediate();
  } else if (_canvas) {
    _canvas.getContext('2d').clearRect(
      0,
      0,
      _canvas.width,
      _canvas.height
    );
  }
}

/**
 * @param {Object} ctx
 */
function painIcon(ctx) {
  var info = {
    height: 20,
    left: 2,
    top: 2,
    width: 20
  };

  ctx.lineWidth = 1;
  ctx.strokeStyle = '#beb821';
  ctx.fillStyle = '#f6f055';

  ctx.fillRect(
    info.left,
    info.top,
    info.width,
    info.height
  );

  ctx.strokeStyle = '#beb821';
  ctx.strokeRect(
    info.left,
    info.top,
    info.width,
    info.height
  );

  ctx.fillStyle = '#444';
  ctx.font = '12px Verdana';
  ctx.fillText('B', 7, 16);
}

/**
 * @param {Object} ctx
 * @param {Object} meta
 */
function paintBorder(ctx, info, borderWidth, borderColor) {
  // outline
  ctx.lineWidth = 1;
  ctx.strokeStyle = OUTLINE_COLOR;

  ctx.strokeRect(
    info.left - 1,
    info.top - 1,
    info.width + 2,
    info.height + 2
  );

  // inset
  ctx.lineWidth = 1;
  ctx.strokeStyle = OUTLINE_COLOR;
  ctx.strokeRect(
    info.left + borderWidth,
    info.top + borderWidth,
    info.width - borderWidth,
    info.height - borderWidth
  );
  ctx.strokeStyle = borderColor;

  if (info.should_update) {
    ctx.setLineDash([2]);
  } else {
    ctx.setLineDash([0]);
  }

  // border
  ctx.lineWidth = '' + borderWidth;
  ctx.strokeRect(
    info.left + Math.floor(borderWidth / 2),
    info.top + Math.floor(borderWidth / 2),
    info.width - borderWidth,
    info.height - borderWidth
  );

  ctx.setLineDash([0]);
}

/**
 * @param {Object} ctx
 * @param {Object} meta
 */
function paintMeta(ctx, meta) {
  var info = meta.update_info;
  var color = COLORS[meta.update_count - 1] || LAST_COLOR;
  paintBorder(ctx, info, 2, color);
}

/**
 * @return {Element}
 */
function injectCanvas() {
  var node = document.createElement('canvas');
  node.width = window.screen.availWidth;
  node.height = window.screen.availHeight;
  node.style.cssText = (
    // 'background: green;' +
    // 'opacity: 0.5' +;
    'bottom: 0;' +
    'left: 0;' +
    'pointer-events: none;' +
    'position: fixed;' +
    'right: 0;' +
    'top: 0;' +
    'z-index: 1000000000;'
  );
  document.documentElement.insertBefore(
    node,
    document.documentElement.firstChild
  );
  return node;
}

function paintImmediate() {
  if (!_enabled) {
    return;
  }

  if (!_canvas) {
    _canvas = injectCanvas();
  }

  if (_isPainting) {
    return;
  }

  _isPainting = true;

  var ctx = _canvas.getContext('2d');
  ctx.clearRect(
    0,
    0,
    _canvas.width,
    _canvas.height
  );

  var now = Date.now();
  var meta;

  for (var reactid in _queue) {
    if (!_queue.hasOwnProperty(reactid)) {
      continue;
    }
    meta = _queue[reactid];
    if (meta.expire_time > now) {
      paintMeta(ctx, meta);
    } else {
      delete _queue[reactid];
    }
  }

  painIcon(ctx);
  _isPainting = false;
}

function paint() {
  if (!_enabled) {
    return;
  }
  requestAnimationFrame(paintImmediate);
}

/**
 * @param {Object} batchedInfo
 */
function batchUpdate(batchedInfo) {
  if (!_enabled) {
    return;
  }
  for (var bid in batchedInfo) {
    if (batchedInfo.hasOwnProperty(bid)) {
      var info = batchedInfo[bid];
      var reactid = info.reactid;
      var meta;
      if (_queue.hasOwnProperty(reactid)) {
        meta = _queue[reactid];
      } else {
        meta = {
          update_count: 0
        };
      }

      meta.update_count++;
      meta.update_info = info;
      meta.expire_time = Date.now() + DURATION;
      _queue[reactid] = meta;
    }
  }

  paint();

  // Clean up expired rect.
  setTimeout(paint, DURATION + 1);
}

var Presenter = {
  batchUpdate: batchUpdate,
  setEnabled: setEnabled,
};

module.exports = Presenter;
