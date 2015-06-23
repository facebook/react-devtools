
var ports = {};

chrome.runtime.onConnect.addListener(function (port) {
  var tab = null;
  var name = null;
  if (+port.name + '' === port.name) {
    tab = port.name;
    name = 'devtools';
  } else {
    tab = port.sender.tab.id;
    name = port.name;
  }
  if (!ports[tab]) {
    ports[tab] = {};
  }
  ports[tab][name] = port;

  if (ports[tab]['devtools'] && ports[tab]['reporter']) {
    pipe(ports[tab]['devtools'], ports[tab]['reporter']);
    pipe(ports[tab]['reporter'], ports[tab]['devtools']);
  }
});

function pipe(source, sink) {
  sink.onDisconnect.addListener(function () {
    source.onMessage.removeListener(listener);
  });
  source.onMessage.addListener(listener);
  function listener (message) {
    sink.postMessage(message);
  }
}

