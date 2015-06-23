
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
      this.hover = this.win.document.createElement('div');
      this.hover.style.backgroundColor = 'rgba(255,0,0,.1)';
      this.hover.style.pointerEvents = 'none';
      this.hover.style.position = 'fixed';
      this.win.document.body.appendChild(this.hover);
    }
    this.inspected = node;
    var pos = nodePos(node);
    this.hover.style.top = pos.top + 'px';
    this.hover.style.width = node.offsetWidth + 'px';
    this.hover.style.height = node.offsetHeight + 'px';
    this.hover.style.left = pos.left + 'px';
  }

  hideHighlight() {
    this.inspecting = false;
    if (!this.hover) {
      return;
    }
    this.hover.parentNode.removeChild(this.hover);
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
    var doc = this.win.document;
    var b = doc.createElement('button');
    b.onclick = this.startInspecting.bind(this);
    b.innerHTML = '&#128269;';
    b.style.backgroundColor = 'transparent';
    b.style.border = 'none';
    b.style.outline = 'none';
    b.style.cursor = 'pointer';
    b.style.position = 'fixed';
    b.style.bottom = '10px';
    b.style.right = '10px';
    b.style.fontSize = '30px';
    b.style.zIndex = 10000;
    doc.body.appendChild(b);
    this._button = b;
  }
}

function nodePos(node) {
  var left = 0;
  var top = 0;
  while (node) {
    left += node.offsetLeft;
    top += node.offsetTop;
    left -= node.scrollLeft;
    top -= node.scrollTop;
    node = node.offsetParent;
  }
  return {left, top};
}

module.exports = Highlighter;
