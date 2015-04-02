var MessageType = require('../share/MessageType');
var getReactInternals = require('./getReactInternals');
var postDataToScriptInjector = require('./postDataToScriptInjector');

function main() {
  getReactInternals().then((ReactInternals) => {
    postDataToScriptInjector(MessageType.REACT_RUNERTIME_READY);
  });
};

main();



