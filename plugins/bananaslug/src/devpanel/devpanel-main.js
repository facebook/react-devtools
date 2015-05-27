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

