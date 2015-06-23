
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

    /*
    chrome.devtools.panels.elements.onSelectionChanged.addListener(() => {
      console.log('selection changed!');
      chrome.devtools.inspectedWindow.eval('window.__REACT_DEVTOOLS_BACKEND__.$0 = $0');
    });
    */

    chrome.devtools.network.onNavigated.addListener(() => {
      this.teardown();
      this.setState({loading: true});
      check(isReact => {
        if (isReact) {
          this.inject();
        } else {
          this.setState({isReact: false});
        }
      });
    });
  }

  getNewSelection() {
    chrome.devtools.inspectedWindow.eval('window.__REACT_DEVTOOLS_BACKEND__.$0 = $0');
    this.bridge.send('checkSelection');
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
      // , chrome.runtime.getURL('reporter.html')

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
    });
  }

  render(): ReactElement {
    if (this.state.loading) {
      return <span>Loading...</span>
    }
    if (!this.state.isReact) {
      return <span>React not found on this page</span>
    }
    return <Container />;
  }
}

Panel.childContextTypes = {
  store: React.PropTypes.object,
};

module.exports = Panel;
