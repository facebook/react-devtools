
var Backend = require('../backend');
var Bridge = require('../backend/bridge');
var inject = require('../backend/make-compat');
var Highlighter = require('../frontend/highlighter');

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

