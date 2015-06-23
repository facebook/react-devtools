
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

  var listeners = [];

  var wall = {
    listen(fn) {
      var listener = evt => {
        if (evt.data.source !== 'react-devtools-reporter' || !evt.data.payload) {
          return;
        }
        fn(evt.data.payload)
      };
      listeners.push(listener);
      window.addEventListener('message', listener);
    },
    send(data) {
      reporter.contentWindow.postMessage(data, '*');
    },
  };

  var bridge = new Bridge();
  bridge.attach(wall);
  var backend = new Backend(window);
  backend.addBridge(bridge);
  
  var hl;

  inject(window, backend);

  backend.on('shutdown', () => {
    listeners.forEach(fn => {
      window.removeEventListener('message', fn);
    });
    listeners = [];
    if (reporter && reporter.parentNode) {
      // remove the iframe
      reporter.parentNode.removeChild(reporter);
    }
    if (hl) {
      hl.stopInspecting();
    }
  });

  if (window.document && window.document.createElement) {
    hl = new Highlighter(window, node => {
      backend.selectFromDOMNode(node);
    });
    // hl.inject();
    backend.on('highlight', node => hl.highlight(node));
    backend.on('hideHighlight', () => hl.hideHighlight());
  }
}
