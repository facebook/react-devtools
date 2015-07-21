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

var fs = require('fs');

function serveBackend(res) {
  fs.readFile(__dirname + '/../build/backend.js', function (err, data) {
    if (err) {
      console.error(err);
      res.writeHead(500);
      res.end('Failed to get file');
      return;
    }
    res.writeHead(200, {ContentType: 'text/plain'});
    res.end(data.toString('utf8'));
  });
}

module.exports = serveBackend;
