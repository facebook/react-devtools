/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

var Harness = require('./Harness');
var Container = require('../../frontend/Container');
var React = require('react');
var globalHook = require('../../backend/GlobalHook');

window.React = React;

var Panel = require('../../frontend/magic');

var target = document.getElementById('target');
function inject(src, done) {
  var script = target.contentDocument.createElement('script');
  script.src = src;
  script.onload = done;
  target.contentDocument.body.appendChild(script);
  // script.parentNode.removeChild(script);
}

var win = target.contentWindow;
globalHook(win);

var config = {
  alreadyFoundReact: true,
  reload: null,
  checkForReact: null,
  reloadSubscribe: null,
  getNewSelection: null,
  selectElement: null,
  showComponentSource: null,
  showAttrSource: null,
  executeFn: null,
  inject(done) {
    inject('./build/backend.js', () => {
      var wall = {
        listen(fn) {
          win.parent.addEventListener('message', evt => fn(evt.data));
        },
        send(data) {
          win.postMessage(data, '*');
        },
      };
      done(wall, () => {});
    });
  },
};

inject('../../test/example/build/target.js', () => {
  var node = document.getElementById('container');
  React.render(
    <Panel {...config} />,
    node
  );
});


