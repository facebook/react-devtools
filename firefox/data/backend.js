
if (unsafeWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__._reactRuntime || unsafeWindow.__REACT_DEVTOOLS_BACKEND__.attachDevTools) {
  self.port.emit('hasReact', true);
  injectBackend();
} else {
  self.port.emit('hasReact', false);
}

function injectBackend() {
  var node = document.createElement('script');

  node.onload = function () {
    window.postMessage({source: 'react-devtools-reporter'}, '*');

    self.port.on('message', function (payload) {
      window.postMessage({
        source: 'react-devtools-reporter',
        payload: payload
      }, '*');
    });

    window.addEventListener('message', function (evt) {
      if (!evt.data || evt.data.source !== 'react-devtools-bridge') {
        return;
      }

      self.port.emit('message', evt.data.payload);
    });
    node.parentNode.removeChild(node);
  }

  node.src = 'resource://react-devtools/build/backend.js'
  document.documentElement.appendChild(node);
}

