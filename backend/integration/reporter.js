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

module.exports = stream => {
  var status = document.createElement('div');
  status.className = 'status';
  var current = document.createElement('pre');
  current.className = 'current';
  var failures = document.createElement('pre');
  failures.className = 'failures';
  document.body.appendChild(status);
  status.innerHTML = 'Status:';
  document.body.appendChild(current);
  // document.body.appendChild(status);
  var pass = 0;
  var fail = 0;
  var curTest = null;
  stream.on('data', data => {
    if (data.type === 'test') {
      current.innerHTML += '  ' + data.id + ': ' + data.name + '\n';
      curTest = data.name;
    }
    if (data.type === 'assert') {
      if (data.ok) {
        pass += 1;
        current.innerHTML += '    <span style="color:green">OK ' + data.name + '</span>\n';
      } else {
        fail += 1;
        current.innerHTML += '    <span style="color:red">FAIL ' + data.name + '\n';
        current.innerHTML += '      Expected: ' + data.expected + ', Actual: ' + data.actual + '</span>\n';
        console.log(curTest, data);
      }
      var color = fail ? 'red' : 'green';
      status.innerHTML = '<span style="color:' + color + '">Status: ' + pass + '/' + (pass + fail) + '</span>';
    }
  });
};
