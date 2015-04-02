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

/**
 * @return {Element}
 */
function createCanvas() {
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
  return node;
}

var _setting = UserDefaultSetting.getInstance('content-script');
var _canvas = createCanvas();
var _ctx = _canvas.getContext('2d');
var _queue = {};
var _isPainting = false;
var _enabled = _setting.isDefaultEnabled();

function clearPaint() {
  _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
}

/**
 * @param {boolean} value
 */
function setEnabled(value) {
  if (value === _enabled) {
    return;
  }

  _enabled = value;

  if (_enabled) {
    // paint the icon.
    paintImmediate();
  } else {
    if (_canvas.parentNode) {
      _canvas.parentNode.removeChild(_canvas);
    }
    _queue = {};
    clearPaint();
  }

  _setting.setDefaultEnabled(_enabled);
}

function painIcon() {
  var info = {
    height: 20,
    left: 2,
    top: 2,
    width: 20
  };

  _ctx.lineWidth = 1;
  _ctx.strokeStyle = '#beb821';
  _ctx.fillStyle = '#f6f055';

  _ctx.fillRect(
    info.left,
    info.top,
    info.width,
    info.height
  );

  _ctx.strokeStyle = '#beb821';
  _ctx.strokeRect(
    info.left,
    info.top,
    info.width,
    info.height
  );

  _ctx.fillStyle = '#444';
  _ctx.font = '12px Verdana';
  _ctx.fillText('R', 7, 16);
}

/**
 * @param {Object} info
 * @param {number} borderWidth
 * @param {string} borderColor
 */
function paintBorder(info, borderWidth, borderColor) {
  // outline
  _ctx.lineWidth = 1;
  _ctx.strokeStyle = OUTLINE_COLOR;

  _ctx.strokeRect(
    info.left - 1,
    info.top - 1,
    info.width + 2,
    info.height + 2
  );

  // inset
  _ctx.lineWidth = 1;
  _ctx.strokeStyle = OUTLINE_COLOR;
  _ctx.strokeRect(
    info.left + borderWidth,
    info.top + borderWidth,
    info.width - borderWidth,
    info.height - borderWidth
  );
  _ctx.strokeStyle = borderColor;

  if (info.should_update) {
    _ctx.setLineDash([2]);
  } else {
    _ctx.setLineDash([0]);
  }

  // border
  _ctx.lineWidth = '' + borderWidth;
  _ctx.strokeRect(
    info.left + Math.floor(borderWidth / 2),
    info.top + Math.floor(borderWidth / 2),
    info.width - borderWidth,
    info.height - borderWidth
  );

  _ctx.setLineDash([0]);
}

/**
 * @param {Object} meta
 */
function paintMeta(meta) {
  var info = meta.update_info;
  var color = COLORS[meta.update_count - 1] || LAST_COLOR;
  paintBorder(info, 2, color);
}

function paintImmediate() {
  if (!_enabled) {
    return;
  }

  if (!_canvas.parentNode) {
    var root = document.documentElement;
    root.insertBefore(_canvas, root.firstChild);
  }

  if (_isPainting) {
    return;
  }

  _isPainting = true;

  clearPaint();

  var now = Date.now();
  var meta;

  for (var reactid in _queue) {
    if (!_queue.hasOwnProperty(reactid)) {
      continue;
    }
    meta = _queue[reactid];
    if (meta.expire_time > now) {
      paintMeta(meta);
    } else {
      delete _queue[reactid];
    }
  }

  painIcon();
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

if (_enabled) {
  // paint icon.
  paint();
}


var Presenter = {
  batchUpdate: batchUpdate,
  setEnabled: setEnabled,
};

module.exports = Presenter;
