
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
      // this.props.reload();
      this.setState({loading: true}, this.props.reload);
      /*
       * this.lookForReact();
       */
    });
  }

  getNewSelection() {
    if (!this.bridge) {
      return;
    }
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
    return <Container />;
  }
}

Panel.childContextTypes = {
  store: React.PropTypes.object,
};

module.exports = Panel;
