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

var UserDefaultSetting = require('../share/UserDefaultSetting');
var Logger = require('../share/Logger');
var constants = require('../share/constants');

var {
  chrome,
  document,
  localStorage,
} = global;

// Do not make this `true` in production.
var SHOW_DEBUG_LOGGER = false;

var _logger = SHOW_DEBUG_LOGGER ? new Logger() : null;
var _setting = UserDefaultSetting.getInstance('devpanel');

function log() {
  if (SHOW_DEBUG_LOGGER) {
    _logger.log.apply(_logger, arguments);
  }
}

function buildDOM() {
  var height = '24px';
  var node = document.createElement('div');
  node.innerHTML = `
    <div style="
      background: #ececec;
      border-bottom: solid 1px #aaa;
      box-sizing: border-box;
      color: #444;
      font: 13px/130% arial;
      height: ${height};
      left: 0;
      overflow: hidden;
      padding: 3px;
      top: 0;
      user-select: none;
      width: 100vw;
      z-index: 100;
      ">
     <label>
       <input
         type="checkbox"
         style="cursor: pointer;"
        />
       trace components updates
     </label>
    </div>
  `;

  node.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
  `;

  // This is the hack to not unclude the node inside the body so no does not
  // inherit styles from body.
  var root = document.documentElement;
  document.body.style.marginTop = height;
  root.insertBefore(node, document.body);

  return node;
}

/**
 * @param {boolean} enabled
 */
function notifyIsEnabled(enabled) {
  var method = constants.GLOBAL_INJECTED_METHOD_SET_ENABLED_NAME;
  var code = `
    try {
      window["${method}"](${enabled});
    } catch (error) {
      console.error(error);
    }
  `;

  try {
    chrome.devtools.inspectedWindow.eval(code);
  } catch (ex) {
    log(ex.message, 'devpanel error');
  }

  try {
    _setting.setDefaultEnabled(enabled);
    var msg = JSON.stringify(localStorage, null, '  ').replace(/\'/g, '\\\'');
    log(msg);
    // _setting = UserDefaultSetting.getInstance('devpanel');
    // _setting.setDefaultEnabled(enabled);
  } catch (ex) {
    log(ex.message, 'devpanel error');
  }

  return true;
}

function main() {
  var enabled;
  try {
    enabled = _setting.isDefaultEnabled();
  } catch (ex) {
    log(ex.message, 'devpanel error');
    return;
  }

  var root = buildDOM();
  var checkbox = root.querySelector('input');
  checkbox.checked = enabled;

  checkbox.addEventListener(
    'change',
    () => notifyIsEnabled(checkbox.checked),
    true
  );

  notifyIsEnabled(enabled);
  log('devpanel started');
}

main();

