
var React = require('react/addons');
var Backend = require('../backend');
var inject = require('../backend/inject');
var compatInject = require('../backend/compat-inject');
var Store = require('./store');
var Bridge = require('../backend/bridge');
var makeWall = require('./wall');

class Harness extends React.Component {
  componentWillMount() {
    var wall = makeWall();
    this.backend = new Backend(new Bridge(wall.left))
    this.store = new Store(new Bridge(wall.right));
    window.addEventListener('keydown', this.store.onKeyDown.bind(this.store));
    window.backend = this.backend
  }

  getChildContext() {
    return {
      store: this.store,
    };
  }

  componentDidMount() {
    var iframe = React.findDOMNode(this.iframe)
    var win = iframe.contentWindow
    var doc = iframe.contentDocument
    inject(this.backend, win, true);
    compatInject(win);
    var script = doc.createElement('script');
    script.src = this.props.targetSrc
    doc.head.appendChild(script);
  }

  render() {
    var backend = this.backend
    return <div style={styles.harness}>
      <div style={styles.leftSide}>
        {React.addons.cloneWithProps(this.props.children, {backend})}
      </div>
      <div style={styles.rightSide}>
        <iframe style={styles.iframe} ref={n => this.iframe = n} />
      </div>
    </div>
  }
}

Harness.childContextTypes = {
  store: React.PropTypes.object,
};

var styles = {
  harness: {
    display: 'flex',
    flexDirection: 'row',
    height: '700px',
  },

  leftSide: {
    flex: 1,
    display: 'flex',
  },

  rightSide: {
    flex: 1,
    display: 'flex',
  },

  iframe: {
    border: 'none',
    flex: 1,
  },
}

module.exports = Harness
