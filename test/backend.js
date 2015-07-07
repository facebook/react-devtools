
var Backend = require('../backend/Backend');
var Bridge = require('../backend/Bridge');
var inject = require('../backend/makeCompat');
var Highlighter = require('../frontend/Highlighter');

var wall = {
  listen(fn) {
    window.addEventListener('message', evt => fn(evt.data));
  },
  send(data) {
    window.parent.postMessage(data, '*');
  },
};

var bridge = new Bridge();
bridge.attach(wall);
var backend = new Backend(window);
backend.addBridge(bridge);

inject(window, backend);

var hl = new Highlighter(window, node => {
  backend.selectFromDOMNode(node);
});
hl.inject();
backend.on('highlight', data => hl.highlight(data.node, data.name));
backend.on('hideHighlight', () => hl.hideHighlight());

