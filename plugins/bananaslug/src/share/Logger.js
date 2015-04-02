
var {
  document,
} = global;

/**
 * Simple & sloppy logger that lets you debug some message easily.
 */
class Logger {
  constructor() {
    this._node = null;
  }

  /**
   * @param {string} message
   * @param {?string} label
   */
  log(message, label) {
    var node = this._node;
    if (!node) {
      node = document.createElement('textarea');
      node.style.cssText = `
        bottom: 0;
        box-sizing: border-box;
        border-color: #ccc;
        border-width: 0 0 0 2px;
        outline: none;
        overflow: 'auto';
        padding: 10px;
        position: fixed;
        resize: horizontal;
        right: 0;
        top: 0;
        width: 300px;
        z-index: 100000;
      `;
      document.body.appendChild(node);
      this._node = node;
    }
    label = label ? `[${label}]` : '[log]';
    node.value += `\n${label}\n${String(message)}\n`;
    node.scrollTop = node.scrollHeight;
  }
}

module.exports = Logger;
