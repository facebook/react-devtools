/**
 * Copyright (c) 2013-2014, Facebook, Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *  * Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 *  * Neither the name Facebook nor the names of its contributors may be used to
 *    endorse or promote products derived from this software without specific
 *    prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
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
