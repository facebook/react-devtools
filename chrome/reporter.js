
// proxy from main page to devtools (via the background page)
var port = chrome.runtime.connect({
  name: 'reporter',
});

window.addEventListener('message', function (evt) {
  if (evt.data && evt.data.source === 'react-devtools-bridge') {
    port.postMessage(evt.data.payload);
  }
});

port.onMessage.addListener(function (message) {
  // console.log('from background', message);
  window.postMessage({
    source: 'react-devtools-reporter',
    payload: message
  }, '*');
});

window.parent.postMessage({
  source: 'react-devtools-reporter',
  hello: true,
}, '*');

port.onDisconnect.addListener(function () {
  window.postMessage({
    source: 'react-devtools-reporter',
    payload: {
      type: 'event',
      evt: 'shutdown',
    },
  }, '*');
});

