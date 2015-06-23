
var Backend = require('../backend');
var Bridge = require('../backend/bridge');
var inject = require('../backend/make-compat');
var Highlighter = require('../frontend/highlighter');

window.addEventListener('message', welcome);

function findReporter() {
  var found = null;
  [].forEach.call(document.head.childNodes, node => {
    if (node.nodeName === 'IFRAME' && node.className === 'react-devtools-reporter') {
      found = node;
    }
  });
  return found;
}

function welcome(evt) {
  if (evt.data.source !== 'react-devtools-reporter') {
    return;
  }

  window.removeEventListener('message', welcome);

  var reporter = findReporter();

  var wall = {
    listen(fn) {
      window.addEventListener('message', evt => {
        if (evt.data.source !== 'react-devtools-reporter') {
          return;
        }
        fn(evt.data.payload)
      });
    },
    send(data) {
      reporter.contentWindow.postMessage(data, '*');
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
  // hl.inject();
  backend.on('highlight', node => hl.highlight(node));
  backend.on('hideHighlight', () => hl.hideHighlight());
}
