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

var checkForReact = require('./checkForReact');
var inject = require('./inject');

type Listenable = {
  addListener: (fn: (message: Object) => void) => void,
}

type Port = {
  disconnect: () => void,
  onMessage: Listenable,
  onDisconnect: Listenable,
  postMessage: (data: Object) => void,
};

declare var chrome: {
  devtools: {
    network: {
      onNavigated: {
        addListener: (fn: () => void) => void,
        removeListener: (fn: () => void) => void,
      },
    },
    inspectedWindow: {
      eval: (code: string, cb?: (res: any, err: ?Object) => any) => void,
      tabId: number,
    },
  },
  runtime: {
    getURL: (path: string) => string,
    connect: (config: Object) => Port,
  },
};

var config = {
  reload,
  checkForReact,
  reloadSubscribe(reload) {
    chrome.devtools.network.onNavigated.addListener(reload);
    return () => {
      chrome.devtools.network.onNavigated.removeListener(reload);
    };
  },
  getNewSelection(bridge) {
    chrome.devtools.inspectedWindow.eval('window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$0 = $0');
    bridge.send('checkSelection');
  },
  selectElement(bridge, id) {
    bridge.send('putSelectedNode', id);
    setTimeout(() => {
      chrome.devtools.inspectedWindow.eval('inspect(window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$node)');
    }, 100);
  },
  showComponentSource(vbl) {
    // if it is an es6 class-based component, (isMounted throws), then inspect
    // the constructor. Otherwise, inspect the render function.
    var code = `Object.getOwnPropertyDescriptor(window.${vbl}.__proto__.__proto__, 'isMounted') &&
      Object.getOwnPropertyDescriptor(window.${vbl}.__proto__.__proto__, 'isMounted').value ?
        inspect(window.${vbl}.render) : inspect(window.${vbl}.constructor)`;
    chrome.devtools.inspectedWindow.eval(code, (res, err) => {
      if (err) {
        console.error('Failed to inspect component', err);
      }
    });
  },
  showAttrSource(path) {
    var attrs = '[' + path.map(m => JSON.stringify(m)).join('][') + ']';
    var code = 'inspect(window.$r' + attrs + ')';
    chrome.devtools.inspectedWindow.eval(code, (res, err) => {
      if (err) {
        console.error('Failed to inspect source', err);
      }
    });
  },
  executeFn(path) {
    var attrs = '[' + path.map(m => JSON.stringify(m)).join('][') + ']';
    var code = 'window.$r' + attrs + '()';
    chrome.devtools.inspectedWindow.eval(code, (res, err) => {
      if (err) {
        console.error('Failed to call function', err);
      }
    });
  },
  inject(done) {
    inject(chrome.runtime.getURL('build/backend.js'), () => {
      var port = this._port = chrome.runtime.connect({
        name: '' + chrome.devtools.inspectedWindow.tabId,
      });
      var disconnected = false;

      var wall = {
        listen(fn) {
          port.onMessage.addListener(message => fn(message));
        },
        send(data) {
          if (disconnected) {
            return;
          }
          port.postMessage(data);
        },
      };

      port.onDisconnect.addListener(() => {
        disconnected = true;
      });
      done(wall, () => port.disconnect());
    });
  },
};

var globalHook = require('../../../backend/GlobalHook');
globalHook(window);
var Panel = require('../../../frontend/Panel');
var React = require('react');

var node = document.getElementById('container');

function reload() {
  setTimeout(() => {
    React.unmountComponentAtNode(node);
    node.innerHTML = '';
    React.render(<Panel {...config} />, node);
  }, 100);
}

React.render(<Panel alreadyFoundReact={true} {...config} />, node);
