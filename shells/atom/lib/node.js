/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

var JsonSocket = require('../../electron/node_modules/json-socket');
var net = require('net');

module.exports = function (onConnected) {
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
      onConnected(wall);
    }, 500);
  });

  socket.connect(8011); // , 'localhost');
};
