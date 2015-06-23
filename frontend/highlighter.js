
class Highlighter {
  constructor(win, onSelect) {
    this.win = win;
    this.onSelect = onSelect;
    this._cb = this.onHover.bind(this);
    this._click = this.onClick.bind(this);
    this._mdown = this.onMouseDown.bind(this);
    this.hover = null;
    this.win.addEventListener('mouseover', this._cb, true);
    this.win.addEventListener('mousedown', this._mdown, true);
    this.win.addEventListener('click', this._click, true);
  }

  startInspecting() {
    this.inspecting = true;
  }

  stopInspecting() {
    this.win.removeEventListener('mouseover', this._cb);
    this.win.removeEventListener('mousedown', this._mdown);
    this.win.removeEventListener('click', this._click);
    this.hideHighlight();
    if (this._button && this._button.parentNode) {
      this._button.parentNode.removeChild(this._button);
    }
  }

  highlight(node) {
    if (!this.hover) {
      this.hover = new Overlay(this.win);
    }
    this.inspected = node;
    this.hover.inspect(node);
  }

  hideHighlight() {
    this.inspecting = false;
    if (!this.hover) {
      return;
    }
    this.hover.remove();
    this.hover = null;
  }

  onMouseDown(evt) {
    if (!this.inspecting) {
      return;
    }
    evt.preventDefault();
    evt.stopPropagation();
    evt.cancelBubble = true;
    this.onSelect(evt.target);
    return;
  }

  onClick(evt) {
    if (!this.inspecting) {
      return;
    }
    evt.preventDefault();
    evt.stopPropagation();
    evt.cancelBubble = true;
    this.hideHighlight();
  }

  onHover(evt) {
    if (!this.inspecting) {
      return;
    }
    evt.preventDefault();
    evt.stopPropagation();
    evt.cancelBubble = true;
    this.highlight(evt.target);
  }

  inject() {
    this._button = makeMagnifier();
    this._button.onclick = this.startInspecting.bind(this);
    this.win.document.body.appendChild(this._button);
  }
}

function makeMagnifier() {
  var button = document.createElement('button');
  button.innerHTML = '&#128269;';
  button.style.backgroundColor = 'transparent';
  button.style.border = 'none';
  button.style.outline = 'none';
  button.style.cursor = 'pointer';
  button.style.position = 'fixed';
  button.style.bottom = '10px';
  button.style.right = '10px';
  button.style.fontSize = '30px';
  button.style.zIndex = 10000;
  return button;
}

var overlayStyles = {
  background: 'rgba(120, 170, 210, 0.7)',
  padding: 'rgba(77, 200, 0, 0.3)',
  margin: 'rgba(255, 132, 0, 0.3)',
  border: 'rgba(255, 200, 50, 0.3)',
};

function drawAround(ctx, left, top, width, height, what, dims) {
  var mTop = dims[what + 'Top'];
  var mLeft = dims[what + 'Left'];
  var mRight = dims[what + 'Right'];
  var mBottom = dims[what + 'Bottom'];
  ctx.fillRect(left, top - mTop, width, mTop);
  ctx.fillRect(left - mLeft, top - mTop, mLeft, height + mTop + mBottom);
  ctx.fillRect(left + width, top - mTop, mRight, height + mTop + mBottom);
  ctx.fillRect(left, top + height, width, mBottom);
}

class Overlay {
  constructor(window) {
    this.node = window.document.createElement('canvas');
    this.node.style.pointerEvents = 'none';
    this.node.style.position = 'fixed';
    this.node.style.top = 0;
    this.node.style.bottom = 0;
    this.node.style.left = 0;
    this.node.style.right = 0;
    this.node.width = window.innerWidth;
    this.node.height = window.innerHeight;
    this.ctx = this.node.getContext('2d');
    this.width = this.node.width;
    this.height = this.node.height;
    window.document.body.appendChild(this.node);
  }

  remove() {
    this.node.parentNode.removeChild(this.node);
  }

  inspect(node) {
    var pos = nodePos(node);
    this.ctx.clearRect(0,0,this.width,this.height);
    var dims = getElementDimensions(node);
    var iW = node.offsetWidth - dims.borderLeft - dims.borderRight;
    var iH = node.offsetHeight - dims.borderTop - dims.borderBottom;
    var iX = pos.left + dims.borderLeft;
    var iY = pos.top + dims.borderTop;
    var iiW = iW - dims.paddingLeft - dims.paddingRight;
    var iiH = iH - dims.paddingTop - dims.paddingBottom;
    var iiX = iX + dims.paddingLeft;
    var iiY = iY + dims.paddingTop;
    this.ctx.fillStyle = overlayStyles.background;
    this.ctx.fillRect(iiX, iiY, iiW, iiH);
    this.ctx.fillStyle = overlayStyles.margin;
    drawAround(this.ctx, pos.left, pos.top, node.offsetWidth, node.offsetHeight, 'margin', dims);
    this.ctx.fillStyle = overlayStyles.border;
    drawAround(this.ctx, iX, iY, iW, iH, 'border', dims);
    this.ctx.fillStyle = overlayStyles.padding;
    drawAround(this.ctx, iiX, iiY, iiW, iiH, 'padding', dims);
  }
}


function nodePos(node) {
  var left = node.offsetLeft;
  var top = node.offsetTop;
  while (node && node !== document.body && node.offsetParent) {
    var oP = node.offsetParent;
    var p = node.parentNode;
    while (p !== oP) {
      left -= p.scrollLeft;
      top -= p.scrollTop;
      p = p.parentNode;
    }
    left += oP.offsetLeft;
    top += oP.offsetTop;
    left -= oP.scrollLeft;
    top -= oP.scrollTop;
    node = oP;
  }
  return {left, top};
}

function getElementDimensions(element) {
  var calculatedStyle = window.getComputedStyle(element);

  return {
    borderLeft: +calculatedStyle.borderLeftWidth.match(/[0-9]*/)[0],
    borderRight: +calculatedStyle.borderRightWidth.match(/[0-9]*/)[0],
    borderTop: +calculatedStyle.borderTopWidth.match(/[0-9]*/)[0],
    borderBottom: +calculatedStyle.borderBottomWidth.match(/[0-9]*/)[0],
    marginLeft: +calculatedStyle.marginLeft.match(/[0-9]*/)[0],
    marginRight: +calculatedStyle.marginRight.match(/[0-9]*/)[0],
    marginTop: +calculatedStyle.marginTop.match(/[0-9]*/)[0],
    marginBottom: +calculatedStyle.marginBottom.match(/[0-9]*/)[0],
    paddingLeft: +calculatedStyle.paddingLeft.match(/[0-9]*/)[0],
    paddingRight: +calculatedStyle.paddingRight.match(/[0-9]*/)[0],
    paddingTop: +calculatedStyle.paddingTop.match(/[0-9]*/)[0],
    paddingBottom: +calculatedStyle.paddingBottom.match(/[0-9]*/)[0]
  };
}

module.exports = Highlighter;
