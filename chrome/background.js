
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
    doublePipe(ports[tab]['devtools'], ports[tab]['reporter']);
  }
});

function doublePipe(one, two) {
  one.onMessage.addListener(lOne);
  function lOne(message) {
    two.postMessage(message);
  }
  two.onMessage.addListener(lTwo);
  function lTwo(message) {
    one.postMessage(message);
  }
  function shutdown() {
    one.onMessage.removeListener(lOne);
    two.onMessage.removeListener(lTwo);
    one.disconnect();
    two.disconnect();
  }
  one.onDisconnect.addListener(shutdown);
  two.onDisconnect.addListener(shutdown);
}

