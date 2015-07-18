
// this is not compiled by babel / webpack

var http = require('http');
var ws = require('ws');
var serveBackend = require('./node/serveBackend.js');

var server = http.createServer(function (req, res) {
  // console.log('req'+ req.url);
  if (req.url === '/backend') {
    return serveBackend(res);
  } else if (req.url === '/websocket') {
    return; // handled by wss
  }
  res.writeHead(404);
  res.end('Not found');
}).listen(8097, '::');

var wss = new ws.Server({
  server: server,
  path: '/websocket',
});

wss.on('connection', function (ws) {
  var listeners;
  ws.onerror = function (err) {
    window.onDisconnected();
    console.log('error connection', err);
  };
  ws.onclose = function () {
    window.onDisconnected();
    console.log('error things');
  };
  ws.onmessage = function (evt) {
    // console.log('<<--', evt.data);
    var data = JSON.parse(evt.data);
    listeners.forEach(function (fn) {fn(data)});
  };
  console.log('connected to react native');
  listeners = [];

  var wall = {
    listen(fn) {
      listeners.push(fn);
    },
    send(data) {
      // console.log('-->>' + JSON.stringify(data));
      ws.send(JSON.stringify(data));
    },
    disconnect() {
      ws.close();
    },
  };

  onConnected(wall);
});

window.onConnected = function () {
  console.error('No onConnected set');
};
window.onDisconnected = function () {
  console.error('No onDisconnected set');
};

