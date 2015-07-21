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

var React = require('react');
var Bridge = require('../../../../agent/Bridge');
var Container = require('../../../../frontend/Container');
var NativeStyler = require('../../../../plugins/ReactNativeStyle/ReactNativeStyle.js');
var Store = require('../../../../frontend/Store');
var keyboardNav = require('../../../../frontend/keyboardNav');

var checkForReact = require('./checkForReact');
var consts = require('../../../../agent/consts');
var inject = require('./inject');

import type {DOMEvent} from '../../../../frontend/types';

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

class Panel extends React.Component {
  _port: ?Port;
  _keyListener: ?(e: DOMEvent) => void;
  _checkTimeout: ?number;
  _unMounted: boolean;
  _bridge: ?Bridge;
  _store: Store;
  _unsub: ?() => void;

  constructor(props: Object) {
    super(props);
    this.state = {loading: true, isReact: this.props.alreadyFoundReact};
    this._unMounted = false;
    window.panel = this;
  }

  getChildContext(): Object {
    return {
      store: this._store,
    };
  }

  componentDidMount() {
    if (this.props.alreadyFoundReact) {
      this.inject();
    } else {
      this.lookForReact();
    }

    var reload = () => this.reload();
    this._unsub = () => {
      chrome.devtools.network.onNavigated.removeListener(reload);
    };
    chrome.devtools.network.onNavigated.addListener(reload);
  }

  componentWillUnmount() {
    this._unMounted = true;
    if (this._unsub) {
      this._unsub();
    }
  }

  reload() {
    if (this._unsub) {
      this._unsub();
    }
    this.teardown();
    if (!this._unMounted) {
      this.setState({loading: true}, this.props.reload);
    }
  }

  getNewSelection() {
    if (!this._bridge) {
      return;
    }
    chrome.devtools.inspectedWindow.eval('window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$0 = $0');
    // $FlowFixMe flow thinks `this._bridge` might be null
    this._bridge.send('checkSelection');
  }

  sendSelection(id: string) {
    if (!this._bridge || (!id && !this._store.selected)) {
      return;
    }
    // $FlowFixMe - either id or this._store.selected is not null
    id = id || this._store.selected;
    this._bridge.send('putSelectedNode', id);
    setTimeout(() => {
      chrome.devtools.inspectedWindow.eval('inspect(window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$node)');
    }, 100);
  }

  inspectComponent(vbl: string) {
    vbl = vbl || '$r';
    var code = `Object.getOwnPropertyDescriptor(window.${vbl}.__proto__.__proto__, 'isMounted') &&
      Object.getOwnPropertyDescriptor(window.${vbl}.__proto__.__proto__, 'isMounted').value ?
        inspect(window.${vbl}.render) : inspect(window.${vbl}.constructor)`;
    chrome.devtools.inspectedWindow.eval(code, (res, err) => {
      if (err) {
        debugger;
      }
    });
  }

  viewSource(id: string) {
    if (!this._bridge) {
      return;
    }
    this._bridge.send('putSelectedInstance', id);
    setTimeout(() => {
      this.inspectComponent('__REACT_DEVTOOLS_GLOBAL_HOOK__.$inst');
    }, 100);
  }

  viewAttrSource(path: Array<string>) {
    var attrs = '[' + path.map(m => JSON.stringify(m)).join('][') + ']';
    var code = 'inspect(window.$r' + attrs + ')';
    chrome.devtools.inspectedWindow.eval(code, (res, err) => {
      if (err) {
        debugger;
      }
    });
  }

  executeFn(path: Array<string>) {
    var attrs = '[' + path.map(m => JSON.stringify(m)).join('][') + ']';
    var code = 'window.$r' + attrs + '()';
    chrome.devtools.inspectedWindow.eval(code, (res, err) => {
      if (err) {
        debugger;
      }
    });
  }

  teardown() {
    if (this._keyListener) {
      window.removeEventListener('keydown', this._keyListener);
      this._keyListener = null;
    }
    if (this._bridge) {
      this._bridge.send('shutdown');
    }
    if (this._port) {
      this._port.disconnect();
      this._port = null;
    }
    this._bridge = null;
  }

  inject() {
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

      this._bridge = new Bridge();
      // $FlowFixMe flow thinks `this._bridge` might be null
      this._bridge.attach(wall);

      // xx FlowFixMe this._bridge is not null
      if (this._bridge) {
        this._store = new Store(this._bridge);
      }
      this._keyListener = keyboardNav(this._store, window);

      window.addEventListener('keydown', this._keyListener);

      this._store.on('connected', () => {
        this.setState({loading: false});
        this.getNewSelection();
      });

    });
  }

  componentDidUpdate() {
    if (!this.state.isReact) {
      if (!this._checkTimeout) {
        this._checkTimeout = setTimeout(() => {
          this._checkTimeout = null;
          this.lookForReact();
        }, 200);
      }
    }
  }

  lookForReact() {
    checkForReact(isReact => {
      if (isReact) {
        this.setState({isReact: true, loading: true});
        this.inject();
      } else {
        console.log('still looking...');
        this.setState({isReact: false, loading: false});
      }
    });
  }

  render() {
    if (this.state.loading) {
      return (
        <div style={styles.loading}>
          <h1>Connecting to react...</h1>
          <br/>
          If this is React Native, you need to interact with the app (just tap the screen) in order to establish the bridge.
        </div>
      );
    }
    if (!this.state.isReact) {
      return <span>Looking for react...</span>;
    }
    return (
      // $FlowFixMe flow thinks Container needs to extend React.Component
      <Container
        reload={this.reload.bind(this)}
        menuItems={{
          attr: (id, node, val, path, name) => {
            if (!val || node.get('nodeType') !== 'Composite' || val[consts.type] !== 'function') {
              return;
            }
            return [{
              title: 'Show Source',
              action: () => this.viewAttrSource(path),
            }, {
              title: 'Execute function',
              action: () => this.executeFn(path),
            }];
          },
          tree: (id, node) => {
            return [node.get('nodeType') === 'Composite' && {
              title: 'Show Source',
              action: () => this.viewSource(id),
            }, this._store.capabilities.dom && {
              title: 'Show in Elements Pane',
              action: () => this.sendSelection(id),
            }];
          },
        }}
        extraPanes={this._store.capabilities.rnStyle && [panelRNStyle(this._bridge)]}
      />
    );
  }
}

var panelRNStyle = bridge => (node, id) => {
  var props = node.get('props');
  if (!props || !props.style) {
    return <strong>No style</strong>;
  }
  return (
    <div>
      <h3>React Native Style Editor</h3>
      <NativeStyler id={id} bridge={bridge} />
    </div>
  );
};

var styles = {
  chromePane: {
    display: 'flex',
  },
  stretch: {
    flex: 1,
  },
  loading: {
    textAlign: 'center',
    color: '#888',
    padding: 30,
    flex: 1,
  },
};

Panel.childContextTypes = {
  store: React.PropTypes.object,
};

module.exports = Panel;
