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

var MessageType = require('../share/MessageType');
var Presenter = require('./Presenter');
var ScriptInjector = require('./ScriptInjector');

function onReactRuntimeReady() {
  ScriptInjector.inject('injected-main');
}

/**
 * @paran {string} type
 * @param {Object} batchedInfo
 */
function onReactComponentsUpdate(type, batchedInfo) {
  Presenter.batchUpdate(batchedInfo);
}

/**
 * @paran {string} type
 * @param {boolean} enabled
 */
function onEnabledStateChange(type, enabled) {
  Presenter.setEnabled(enabled);
}

function main() {
  ScriptInjector.subscribe(
    MessageType.REACT_RUNERTIME_READY,
    onReactRuntimeReady
  );

  ScriptInjector.subscribe(
    MessageType.REACT_COMPONENTS_DID_UPDATE,
    onReactComponentsUpdate
  );

  ScriptInjector.subscribe(
    MessageType.ENABLED_STATE_CHANGE,
    onEnabledStateChange
  );

  ScriptInjector.inject('injected-prelude');
}

main();
