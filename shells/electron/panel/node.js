
// this is not compiled by babel / webpack

var JsonSocket = require('json-socket');
var net = require('net')

var socket = new JsonSocket(new net.Socket());

socket.on('connect', function () {
  console.log('connected!!');
  /*
  socket.on('message', function (data) {
    console.log('<<--' + JSON.stringify(data));
  });
  */

  var wall = {
    listen(fn) {
      socket.on('message', fn);
    },
    send(data) {
      // console.log('-->>' + JSON.stringify(data));
      socket.sendMessage(data);
    },
    disconnect() {
      socket.end();
    },
  };

  setTimeout(function () {
    window.onConnected(wall);
  }, 500);
});

socket.connect(8011); // , 'localhost');

// window.onConnected = function () {};

