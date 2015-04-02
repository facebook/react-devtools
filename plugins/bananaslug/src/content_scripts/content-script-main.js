
// var Fetcher = require('./Fetcher');
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
