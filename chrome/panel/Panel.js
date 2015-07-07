/** @xxflow **/

var React = require('react');

var inject = require('./inject');
var Container = require('../../frontend/Container');
var check = require('./check');
var Store = require('../../frontend/Store');
var Bridge = require('../../backend/Bridge');
var consts = require('../../backend/consts');

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
  _keyListener: ?() => void;
  _checkTimeout: ?number;
  _unMounted: boolean;
  bridge: ?Bridge;

  constructor(props: Object) {
    super(props)
    this.state = {loading: true, isReact: true};
    this._unMounted = false;
    window.panel = this;
  }

  getChildContext(): Object {
    return {
      store: this.store,
    };
  }

  componentDidMount() {
    this.inject();

    chrome.devtools.network.onNavigated.addListener(() => {
      this.reload();
    });
  }

  componentWillUnmount() {
    this._unMounted = true;
  }

  reload() {
    this.teardown();
    if (!this._unMounted) {
      this.setState({loading: true}, this.props.reload);
    }
  }

  getNewSelection() {
    if (!this.bridge) {
      return;
    }
    chrome.devtools.inspectedWindow.eval('window.__REACT_DEVTOOLS_BACKEND__.$0 = $0');
    this.bridge.send('checkSelection');
  }

  sendSelection(id: string) {
    if (!this.bridge) {
      return;
    }
    id = id || this.store.selected;
    this.bridge.send('putSelectedNode', id);
    setTimeout(() => {
      chrome.devtools.inspectedWindow.eval('inspect(window.__REACT_DEVTOOLS_BACKEND__.$node)');
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
    if (!this.bridge) {
      return;
    }
    this.bridge.send('putSelectedInstance', id);
    setTimeout(() => {
      this.inspectComponent('__REACT_DEVTOOLS_BACKEND__.$inst');
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
    if (this.bridge) {
      this.bridge.send('shutdown');
    }
    if (this._port) {
      this._port.disconnect();
      this._port = null;
    }
    this.bridge = null;
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

      this.bridge = new Bridge();
      this.bridge.attach(wall);

      this.store = new Store(this.bridge);
      this._keyListener = this.store.onKeyDown.bind(this.store)
      window.addEventListener('keydown', this._keyListener);

      this.store.on('connected', () => {
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
    check(isReact => {
      if (isReact) {
        this.setState({isReact: true});
        this.inject();
      } else {
        console.log('still looking...');
        this.setState({isReact: false, loading: false});
      }
    });
  }

  render(): ReactElement {
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
      <Container
        reload={this.reload.bind(this)}
        menuItems={{
          attr: (id, node, val, path, name) => {
            if (!val || node.get('nodeType') !== 'Custom' || val[consts.type] !== 'function') {
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
            return [node.get('nodeType') === 'Custom' && {
              title: 'Show Source',
              action: () => this.viewSource(id),
            }, this.store.capabilities.dom && {
              title: 'Show in Elements Pane',
              action: () => this.sendSelection(id),
            }];
          },
        }}
      />
    );
  }
}

var styles = {
  chromePane: {
    display: 'flex',
  },
  stretch: {
    flex: 1,
  },
  loading: {
    textAlign: 'center',
    padding: 30,
    flex: 1,
  },
}

Panel.childContextTypes = {
  store: React.PropTypes.object,
};

module.exports = Panel;
