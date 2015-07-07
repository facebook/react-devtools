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

var React = require('react/addons');
var compatInject = require('../backend/compatInject');
var Store = require('./Store');
var Bridge = require('../backend/Bridge');

class Harness extends React.Component {
  constructor(props: Object) {
    super(props)
    this.state = {loading: true}
  }

  getChildContext(): Object {
    return {
      store: this.store,
    };
  }

  injectBackend(win) {
    if (!win.__REACT_DEVTOOLS_BACKEND__.injectDevTools && !win.__REACT_DEVTOOLS_GLOBAL_HOOK__._reactRuntime) {
      return console.warn("Looks like React wasn't loaded");
    }

    var wall = {
      listen(fn) {
        win.parent.addEventListener('message', evt => fn(evt.data));
      },
      send(data) {
        win.postMessage(data, '*');
      },
    };

    var bridge = new Bridge();
    bridge.attach(wall);

    this.store = new Store(bridge);
    window.addEventListener('keydown', this.store.onKeyDown.bind(this.store));

    // inject the backend part
    var script = win.document.createElement('script');
    script.src = this.props.backendSrc

    script.onload = () => {
      console.log('loaded backend!');
      this.setState({loading: false});
    }

    win.document.head.appendChild(script);
  }

  componentDidMount() {
    // firefox needs a slight delay
    setTimeout(() => {
      var iframe = React.findDOMNode(this.iframe)

      var win = iframe.contentWindow
      var doc = win.document;

      compatInject(win);

      var script = doc.createElement('script');
      doc.head.appendChild(script);

      script.onload = () => {
        console.log('loaded child!');
        this.injectBackend(win);
      }
      script.src = this.props.targetSrc
    }, 100);
  }

  render(): ReactElement {
    return <div style={styles.harness}>
      <div style={styles.top}>
        <iframe style={styles.iframe} ref={n => this.iframe = n} />
      </div>
      <div style={styles.bottom}>
        {this.state.loading ? 'Loading...' : React.addons.cloneWithProps(this.props.children)}
      </div>
    </div>
  }
}

Harness.childContextTypes = {
  store: React.PropTypes.object,
};

Harness.propTypes = {
  backendSrc: React.PropTypes.string,
  targetSrc: React.PropTypes.string,
};

var styles = {
  harness: {
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  bottom: {
    height: 500,
    display: 'flex',
  },

  top: {
    flex: 1,
    flexDirection: 'column',
    display: 'flex',
  },

  iframe: {
    border: '5px solid magenta',
    height: '400px',
    flex: 1,
  },

  iframeTitle: {
    margin: 0,
    textAlign: 'center',
    fontFamily: 'sans-serif',
  },
}

module.exports = Harness
