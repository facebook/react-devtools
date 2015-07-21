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

var React = require('react');

var Bridge = require('../../../agent/Bridge');
var Container = require('../../../frontend/Container');
var NativeStyler = require('../../../plugins/ReactNativeStyle/ReactNativeStyle');
var Store = require('../../../frontend/Store');

var keyboardNav = require('../../../frontend/keyboardNav');

import type {DOMEvent} from '../../../frontend/types';

type Listenable = {
  addListener: (fn: (message: Object) => void) => void,
}

type Port = {
  disconnect: () => void,
  onMessage: Listenable,
  onDisconnect: Listenable,
  postMessage: (data: Object) => void,
};

class Panel extends React.Component {
  _port: ?Port;
  _keyListener: ?(evt: DOMEvent) => void;
  _checkTimeout: ?number;
  _unMounted: boolean;
  _bridge: ?Bridge;
  _store: Store;

  constructor(props: Object) {
    super(props);
    this.state = {loading: true, isReact: true};
    this._unMounted = false;
    window.panel = this;
  }

  getChildContext(): Object {
    return {
      store: this._store,
    };
  }

  componentDidMount() {
    this.setup();
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

  teardown() {
    if (this._keyListener) {
      this.win.removeEventListener('keydown', this._keyListener);
      this._keyListener = null;
    }
    if (this._bridge) {
      this._bridge.send('shutdown');
    }
    if (this.props.wall) {
      this.props.wall.disconnect();
    }
    this._bridge = null;
  }

  setup() {
    this._bridge = new Bridge();
    // $FlowFixMe flow thinks `this._bridge` might be null
    this._bridge.attach(this.props.wall);

    // $ FlowFixMe flow thinks this._bridge might be null
    if (this._bridge) {
      this._store = new Store(this._bridge, this.props.win);
    }
    this._keyListener = keyboardNav(this._store, this.props.win);
    this.props.win.addEventListener('keydown', this._keyListener);

    this._store.on('connected', () => {
      this.setState({loading: false});
      // this.getNewSelection();
    });
  }

  render() {
    if (this.state.loading) {
      return (
        <div style={styles.loading}>
          <h1>Connecting to react...</h1>
          <br/>
          If this is React Native, you need to interact with the app (just tap the screen) in order to establish the bridge.
          <button onClick={() => this.reload()}>Reload</button>
        </div>
      );
    }
    if (!this.state.isReact) {
      return <span>Looking for react...</span>;
    }
    return (
      // $FlowFixMe Container needn't inherit from React.Component
      <Container
        win={this.props.win}
        reload={this.reload.bind(this)}
        extraPanes={[panelRNStyle(this._bridge)]}
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

window.RNPanel = Panel;
window.RNReact = React;

module.exports = Panel;
