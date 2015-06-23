
var React = require('react');

var inject = require('./inject');
var Container = require('../../frontend/container');
var check = require('./check');
var Store = require('../../frontend/store');
var Bridge = require('../../backend/bridge');
var makeWall = require('./wall');

class Panel extends React.Component {
  constructor(props: Object) {
    super(props)
    this.state = {loading: true, isReact: true};
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

  teardown() {
    if (this._keyListener) {
      window.removeEventListener('keydown', this._keyListener);
      this._keyListener = null;
    }
    if (this._port) {
      this._port.disconnect();
      this._port = null;
    }
  }

  inject() {
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

    var bridge = new Bridge();
    bridge.attach(wall);

    this.store = new Store(bridge);

    inject(chrome.runtime.getURL('build/backend.js'), chrome.runtime.getURL('reporter.html'), () => {
      this.setState({loading: false});
    });
    this._keyListener = this.store.onKeyDown.bind(this.store)
    window.addEventListener('keydown', this._keyListener);
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
