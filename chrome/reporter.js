
// proxy from main page to devtools (via the background page)
var port = chrome.runtime.connect({
  name: 'reporter',
});

var fromPage = function (evt) {
  if (evt.data && evt.data.source === 'react-devtools-bridge') {
    // console.log('from page', evt.data.payload);
    port.postMessage(evt.data.payload);
  }
}

window.addEventListener('message', fromPage);

port.onMessage.addListener(function (message) {
  // console.log('from devtools', message);
  window.postMessage({
    source: 'react-devtools-reporter',
    payload: message
  }, '*');
});

window.postMessage({
  source: 'react-devtools-reporter',
  hello: true,
}, '*');

port.onDisconnect.addListener(function () {
  window.removeEventListener('message', fromPage);
  window.postMessage({
    source: 'react-devtools-reporter',
    payload: {
      type: 'event',
      evt: 'shutdown',
    },
  }, '*');
});

