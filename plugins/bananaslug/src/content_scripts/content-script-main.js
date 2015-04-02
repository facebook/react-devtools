
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

function main() {
  ScriptInjector.subscribe(
    MessageType.REACT_RUNERTIME_READY,
    onReactRuntimeReady
  );

  ScriptInjector.subscribe(
    MessageType.REACT_COMPONENTS_DID_UPDATE,
    onReactComponentsUpdate
  );

  ScriptInjector.inject('injected-prelude');
}

main();
