/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var {
  document,
} = global;

/**
 * Simple & sloppy logger that lets you debug some message easily.
 * Consider using this if console.log() isn't available.
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
