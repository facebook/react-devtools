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
var Container = require('./Container');
var Store = require('./Store');
var keyboardNav = require('./keyboardNav');
var invariant = require('./invariant');

var Bridge = require('../agent/Bridge');
var NativeStyler = require('../plugins/ReactNativeStyle/ReactNativeStyle.js');

var consts = require('../agent/consts');

import type {DOMEvent} from './types';
import type {Wall} from '../agent/Bridge';

export type Props = {
  alreadyFoundReact: boolean,
  inject: (done: (wall: Wall, onDisconnect?: () => void) => void) => void,
  checkForReact: (cb: (isReact: boolean) => void) => void,
  reload: () => void,

  // optionals
  showComponentSource: ?() => void,
  reloadSubscribe: ?(reloadFn: () => void) => () => void,
  showAttrSource: ?(path: Array<string>) => void,
  executeFn: ?(path: Array<string>) => void,
  selectElement: ?(id: string, bridge: Bridge) => void,
  getNewSelection: ?(bridge: Bridge) => void,
};

class Panel extends React.Component {
  _teardownWall: ?() => void;
  _keyListener: ?(e: DOMEvent) => void;
  _checkTimeout: ?number;
  _unMounted: boolean;
  _bridge: ?Bridge;
  _store: Store;
  _unsub: ?() => void;

  props: Props;

  constructor(props: Props) {
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

    if (this.props.reloadSubscribe) {
      this._unsub = this.props.reloadSubscribe(() => this.reload());
    }
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
    if (!this._bridge || !this.props.getNewSelection) {
      return;
    }
    this.props.getNewSelection(this._bridge);
  }

  hideHighlight() {
    this._store.hideHighlight();
  }

  sendSelection(id: string) {
    if (!this._bridge || (!id && !this._store.selected)) {
      return;
    }
    invariant(this.props.selectElement, 'cannot send selection if props.selectElement is not defined');
    // $FlowFixMe either id or this._store.selected is a string
    this.props.selectElement(id || this._store.selected, this._bridge);
  }

  inspectComponent(vbl: string) {
    invariant(this.props.showComponentSource, 'cannot inspect component if props.showComponentSource is not supplied');
    this.props.showComponentSource(vbl || '$r');
  }

  viewSource(id: string) {
    if (!this._bridge) {
      return;
    }
    this._bridge.send('putSelectedInstance', id);
    setTimeout(() => {
      invariant(this.props.showComponentSource, 'cannot view source if props.showComponentSource is not supplied');
      this.props.showComponentSource('__REACT_DEVTOOLS_GLOBAL_HOOK__.$inst');
    }, 100);
  }

  teardown() {
    if (this._keyListener) {
      window.removeEventListener('keydown', this._keyListener);
      this._keyListener = null;
    }
    if (this._bridge) {
      this._bridge.send('shutdown');
    }
    if (this._teardownWall) {
      this._teardownWall();
      this._teardownWall = null;
    }
    this._bridge = null;
  }

  inject() {
    this.props.inject((wall, teardown) => {
      this._teardownWall = teardown;

      this._bridge = new Bridge();
      this._bridge.attach(wall);

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
    this.props.checkForReact(isReact => {
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
          <h1>Connecting to React...</h1>
          <br/>
          If this is React Native, you need to interact with the app (just tap the screen) in order to establish the bridge.
        </div>
      );
    }
    if (!this.state.isReact) {
      return <div style={styles.loading}><h1>Looking for react...</h1></div>;
    }
    return (
      <Container
        reload={this.props.reload && this.reload.bind(this)}
        menuItems={{
          attr: (id, node, val, path, name) => {
            if (!val || node.get('nodeType') !== 'Composite' || val[consts.type] !== 'function') {
              return;
            }
            return [this.props.showAttrSource && {
              title: 'Show Source',
              // $FlowFixMe showAttrSource is provided
              action: () => this.props.showAttrSource(path),
            }, this.props.executeFn && {
              title: 'Execute function',
              // $FlowFixMe executeFn is provided
              action: () => this.props.executeFn(path),
            }];
          },
          tree: (id, node) => {
            return [this.props.showComponentSource && node.get('nodeType') === 'Composite' && {
              title: 'Show Source',
              action: () => this.viewSource(id),
            }, this.props.selectElement && this._store.capabilities.dom && {
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

Panel.childContextTypes = {
  store: React.PropTypes.object,
};

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

module.exports = Panel;

