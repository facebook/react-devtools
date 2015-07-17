var self = require('sdk/self');

// this installs the global hook
require('./pageMod');

// this registers the devtools panel
require('./Tool');

const { trackSelection } = require('./trackSelection');

function main(options, callbacks) {
  trackSelection();
}

function onUnload(reason) {
}

// Exports from this module
exports.main = main;
exports.onUnload = onUnload;
