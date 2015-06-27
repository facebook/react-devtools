/** @ xx flow
 * "called on a possibly undefined value" hl
 * **/

var Backend = require('../backend');
var Bridge = require('../backend/bridge');
var inject = require('../backend/make-compat');
var Highlighter = require('../frontend/highlighter');

window.addEventListener('message', welcome);

// TODO: check to see if we're in RN before doing this?
setInterval(function () {
  // this is needed to force refresh on react native
}, 100);

function welcome(evt) {
  if (evt.data.source !== 'react-devtools-reporter') {
    return;
  }

  window.removeEventListener('message', welcome);

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
      window.postMessage({
        source: 'react-devtools-bridge',
        payload: data,
      }, '*');
    },
  };

  var bridge = new Bridge();
  bridge.attach(wall);
  var backend = new Backend(window);
  backend.addBridge(bridge);

  var hl;

  backend.once('connected', () => {
    inject(window, backend);
  });

  backend.on('shutdown', () => {
    listeners.forEach(fn => {
      window.removeEventListener('message', fn);
    });
    listeners = [];
    if (hl) {
      hl.stopInspecting();
    }
  });

  if (window.document && window.document.createElement) {
    hl = new Highlighter(window, node => {
      backend.selectFromDOMNode(node);
    });
    backend.on('highlight', data => hl.highlight(data.node, data.name));
    backend.on('hideHighlight', () => hl.hideHighlight());
  }
}
