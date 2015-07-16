/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * see $FlowFixMe
 */
'use strict';

var Agent = require('../agent/Agent');
var Bridge = require('../agent/Bridge');
var Highlighter = require('../frontend/Highlighter/Highlighter');

var inject = require('../agent/inject');

// TODO: check to see if we're in RN before doing this?
setInterval(function () {
  // this is needed to force refresh on react native
}, 100);

window.addEventListener('message', welcome);
function welcome(evt) {
  if (evt.data.source !== 'react-devtools-reporter') {
    return;
  }

  window.removeEventListener('message', welcome);
  setup(window.__REACT_DEVTOOLS_GLOBAL_HOOK__)
}

function setup(hook) {
  var listeners = [];

  var wall = {
    listen(fn) {
      var listener = evt => {
        if (evt.data.source !== 'react-devtools-reporter' || !evt.data.payload) {
          return;
        }
        fn(evt.data.payload)
      };
      listeners.push(listener);
      window.addEventListener('message', listener);
    },
    send(data) {
      window.postMessage({
        source: 'react-devtools-bridge',
        payload: data,
      }, '*');
    },
  };

  var RN_STYLE = !!hook.resolveRNStyle;

  var bridge = new Bridge();
  bridge.attach(wall);
  var agent = new Agent(window, {
    rnStyle: RN_STYLE,
  });
  agent.addBridge(bridge);
  var hl;

  agent.once('connected', () => {
    inject(hook, agent);
  });

  if (RN_STYLE) {
    bridge.onCall('rn:getStyle', id => {
      var node = agent.elementData.get(id);
      if (!node || !node.props) {
        return null;
      }
      var style = node.props.style;
      return hook.resolveRNStyle(style);
    });
    bridge.on('rn:setStyle', ({id, attr, val}) => {
      console.log('setting rn style', id, attr, val);
      var data = agent.elementData.get(id);
      if (!data.updater || !data.updater.setInProps) {
        return;
      }
      var style = data.props && data.props.style;
      // $FlowFixMe "computed property keys not supported"
      var newStyle = {}; // {[attr]: val};
      newStyle[attr] = val;
      if (Array.isArray(style)) {
        style = style.concat([newStyle]);
      } else {
        style = [style, newStyle];
      }
      data.updater.setInProps(['style'], style);
    });
  }

  agent.on('shutdown', () => {
    listeners.forEach(fn => {
      window.removeEventListener('message', fn);
    });
    listeners = [];
    if (hl) {
      hl.remove();
    }
  });

  if (window.document && window.document.createElement) {
    hl = new Highlighter(window, node => {
      agent.selectFromDOMNode(node);
    });
    // $FlowFixMe flow things hl might be undefined
    agent.on('highlight', data => hl && hl.highlight(data.node, data.name));
    agent.on('highlightMany', nodes => hl && hl.highlightMany(nodes));
    agent.on('hideHighlight', () => hl && hl.hideHighlight());
  }
}
