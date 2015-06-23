
// proxy from main page to devtools (via the background page)
var port = chrome.runtime.connect({
  name: 'reporter',
});

window.addEventListener('message', function (evt) {
  // console.log('from page', evt.data);
  port.postMessage(evt.data);
});

port.onMessage.addListener(function (message) {
  // console.log('from background', message);
  window.parent.postMessage({
    source: 'react-devtools-reporter',
    payload: message
  }, '*');
});

window.parent.postMessage({
  source: 'react-devtools-reporter'
}, '*');

