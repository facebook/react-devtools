
var Fetcher = require('./Fetcher');
var MessageType = require('../share/MessageType');
var Presenter = require('./Presenter');
var ScriptInjector = require('./ScriptInjector');

function onReactDevToolSuccess() {
  ScriptInjector.subscribe(
    MessageType.REACT_RUNERTIME_READY,
    onReactRuntimeReady
  );

  ScriptInjector.subscribe(
    MessageType.REACT_COMPONENTS_DID_UPDATE,
    onReactComponentsUpdate
  );

  ScriptInjector.inject('injected_scripts_prelude');
}

function onReactDevToolFail() {
  console.info(
    'Please download "React Developer Tools" so that this Bunanaslug ' +
    'extension can work properly. ' +
    'http://goo.gl/lOauXS'
  );
}

function onReactRuntimeReady() {
  ScriptInjector.inject('injected_scripts_main');
}

/**
 * @paran {string} type
 * @param {Object} batchedInfo
 */
function onReactComponentsUpdate(type, batchedInfo) {
  Presenter.batchUpdate(batchedInfo);
}

function main() {
  var REACT_DEV_TOOL_EXTENSION_ID = 'fmkadmapgofadopljbjfkapdkoienihi';
  Fetcher
    .fetchRemote(REACT_DEV_TOOL_EXTENSION_ID, 'views/devpanel.html')
    .then(onReactDevToolSuccess)
    .catch(onReactDevToolFail);
}

main();

module.exports = {};







