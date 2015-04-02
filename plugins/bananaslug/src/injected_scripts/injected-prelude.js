var MessageType = require('../share/MessageType');
var getReactInternals = require('./getReactInternals');
var postDataToScriptInjector = require('./postDataToScriptInjector');

function main() {
  getReactInternals().then(() => {
    postDataToScriptInjector(MessageType.REACT_RUNERTIME_READY);
  });
}

main();
