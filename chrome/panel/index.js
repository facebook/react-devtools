
var React = require('react');

var inject = require('./inject');
var Container = require('../../frontend/container');
var check = require('./check');
var Store = require('../../frontend/store');
var Bridge = require('../../backend/bridge');

class Panel extends React.Component {
  constructor(props: Object) {
    super(props)
    this.state = {loading: true, isReact: true};
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
      this.teardown();
      this.setState({loading: true}, this.props.reload);
    });
  }

  getNewSelection() {
    if (!this.bridge) {
      return;
    }
    chrome.devtools.inspectedWindow.eval('window.__REACT_DEVTOOLS_BACKEND__.$0 = $0');
    this.bridge.send('checkSelection');
  }

  sendSelection() {
    this.bridge.send('putSelectedNode', this.store.selected);
    setTimeout(() => {
      chrome.devtools.inspectedWindow.eval('inspect(window.__REACT_DEVTOOLS_BACKEND__.$node)');
    }, 100);
  }

  inspectComponent() {
    var code = "window.$r.constructor.name === 'Constructor' ? \
      inspect(window.$r.render) : inspect(window.$r.constructor)";
    chrome.devtools.inspectedWindow.eval(code);
  }

  teardown() {
    if (this._keyListener) {
      window.removeEventListener('keydown', this._keyListener);
      this._keyListener = null;
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

      var wall = {
        listen(fn) {
          port.onMessage.addListener(message => fn(message));
        },
        send(data) {
          port.postMessage(data);
        },
      };

      this.bridge = new Bridge();
      this.bridge.attach(wall);

      this.store = new Store(this.bridge);
      this._keyListener = this.store.onKeyDown.bind(this.store)
      window.addEventListener('keydown', this._keyListener);

      this.setState({loading: false});

      this.getNewSelection();
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
        this.setState({isReact: false, loading: false});
      }
    });
  }

  render(): ReactElement {
    if (this.state.loading) {
      return <span>Loading...</span>;
    }
    if (!this.state.isReact) {
      return <span>Looking for react...</span>;
    }
    var extraPanes = [
      node => (
        <ChromePane
          node={node}
          sendSelection={this.sendSelection.bind(this)}
          inspectComponent={this.inspectComponent.bind(this)}
        />
      )
    ];
    return <Container extraPanes={extraPanes} />;
  }
}

class ChromePane {
  render() {
    var node = this.props.node;
    return (
      <div style={styles.chromePane}>
        <div style={styles.stretch} />
        <button onClick={this.props.sendSelection}>Inspect node</button>
        {node.get('nodeType') === 'Custom' &&
          <button onClick={this.props.inspectComponent}>View source</button>}
      </div>
    )
  }
}

var styles = {
  chromePane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  stretch: {
    flex: 1,
  },
}

Panel.childContextTypes = {
  store: React.PropTypes.object,
};

module.exports = Panel;
