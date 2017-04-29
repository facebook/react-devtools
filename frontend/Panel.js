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
var assign = require('object-assign');

var Bridge = require('../agent/Bridge');
var NativeStyler = require('../plugins/ReactNativeStyle/ReactNativeStyle.js');
var RelayPlugin = require('../plugins/Relay/RelayPlugin');

var consts = require('../agent/consts');

import type {DOMEvent} from './types';
import type {Wall} from '../agent/Bridge';

export type Props = {
  alreadyFoundReact: boolean,
  inject: (done: (wall: Wall, onDisconnect?: () => void) => void) => void,


  // if alreadyFoundReact, then these don’t need to be passed
  checkForReact?: (cb: (isReact: boolean) => void) => void,
  reload?: () => void,

  // optionals
  showComponentSource?: (
    globalPathToInst: string,
    globalPathToType: string,
  ) => void,
  showElementSource?: (
    source: Object
  ) => void,

  reloadSubscribe?: (reloadFn: () => void) => () => void,
  showAttrSource?: (path: Array<string>) => void,
  executeFn?: (path: Array<string>) => void,
  selectElement?: (id: string, bridge: Bridge) => void,
  getNewSelection?: (bridge: Bridge) => void,
};

type DefaultProps = {};
type State = {
  loading: boolean,
  isReact: boolean,
};

class Panel extends React.Component {
  _teardownWall: ?() => void;
  _keyListener: ?(e: DOMEvent) => void;
  _checkTimeout: ?number;
  _unMounted: boolean;
  _bridge: Bridge;
  _store: Store;
  _unsub: ?() => void;
  // TODO: typecheck plugin interface
  plugins: Array<any>;

  props: Props;
  defaultProps: DefaultProps;
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {loading: true, isReact: this.props.alreadyFoundReact};
    this._unMounted = false;
    window.panel = this;
    this.plugins = [];
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
    this.teardown();
  }

  pauseTransfer() {
    if (this._bridge) {
      this._bridge.pause();
    }
  }

  resumeTransfer() {
    if (this._bridge) {
      this._bridge.resume();
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

  viewComponentSource(id: string) {
    if (!this._bridge) {
      return;
    }
    this._bridge.send('putSelectedInstance', id);
    setTimeout(() => {
      invariant(this.props.showComponentSource, 'cannot view source if props.showComponentSource is not supplied');
      this.props.showComponentSource(
        '__REACT_DEVTOOLS_GLOBAL_HOOK__.$inst',
        '__REACT_DEVTOOLS_GLOBAL_HOOK__.$type'
      );
    }, 100);
  }

  viewElementSource(id: string, source: Object) {
    if (!this._bridge) {
      return;
    }
    this._bridge.send('putSelectedInstance', id);
    setTimeout(() => {
      invariant(this.props.showElementSource, 'cannot view source if props.showElementSource is not supplied');
      this.props.showElementSource(source);
    }, 100);
  }

  teardown() {
    this.plugins.forEach(p => p.teardown());
    this.plugins = [];
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
  }

  inject() {
    this.props.inject((wall, teardown) => {
      this._teardownWall = teardown;

      this._bridge = new Bridge(wall);

      this._store = new Store(this._bridge);
      var refresh = () => this.forceUpdate();
      this.plugins = [
        new RelayPlugin(this._store, this._bridge, refresh),
      ];
      this._keyListener = keyboardNav(this._store, window);

      window.addEventListener('keydown', this._keyListener);

      this._store.on('connected', () => {
        this.setState({loading: false});
        this.getNewSelection();
      });
    });
  }

  componentDidUpdate() {
    if (!this.state.isReact && this.state.loading) {
      if (!this._checkTimeout) {
        this._checkTimeout = setTimeout(() => {
          this._checkTimeout = null;
          this.lookForReact();
        }, 200);
      }
    }
  }

  lookForReact() {
    if (typeof this.props.checkForReact !== 'function') {
      return;
    }
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
    var showFileUrlWarningMessage = false;
    if (navigator.userAgent.indexOf('Chrome') > -1) {
      // Chrome requires access to 'file URLs' permission for devtools loaded over file://
      showFileUrlWarningMessage = window.location.protocol.indexOf('http') === -1;
    }
    if (this.state.loading) {
      // TODO: This currently shows in the Firefox shell when navigating from a
      // React page to a non-React page. We should show a better message but
      // properly doing so probably requires refactoring how we load the panel
      // and communicate with the bridge.
      return (
        <div style={styles.loading}>
          <h2>Connecting to React…</h2>
        </div>
      );
    }
    if (!this.state.isReact) {
      return (
        <div style={styles.loading}>
          <h2>React was not detected on this page.</h2>
          {showFileUrlWarningMessage &&
            <div style={styles.troubleshootingHint}>
              If this seems wrong, follow the <a href="https://github.com/facebook/react-devtools/blob/master/README.md#the-react-tab-doesnt-show-up" target="_blank">troubleshooting instructions</a>.
            </div>
          }
        </div>
      );
    }
    var extraTabs = assign.apply(null, [{}].concat(this.plugins.map(p => p.tabs())));
    var extraPanes = [].concat(...this.plugins.map(p => p.panes()));
    if (this._store.capabilities.rnStyle) {
      extraPanes.push(panelRNStyle(this._bridge, this._store.capabilities.rnStyleMeasure));
    }
    return (
      <Container
        reload={this.props.reload && this.reload.bind(this)}
        menuItems={{
          attr: (id, node, val, path) => {
            if (!val || node.get('nodeType') !== 'Composite' || val[consts.type] !== 'function') {
              return undefined;
            }
            return [this.props.showAttrSource && {
              key: 'showSource',
              title: 'Show function source',
              // $FlowFixMe showAttrSource is provided
              action: () => this.props.showAttrSource(path),
            }, this.props.executeFn && {
              key: 'executeFunction',
              title: 'Execute function',
              // $FlowFixMe executeFn is provided
              action: () => this.props.executeFn(path),
            }];
          },
          tree: (id, node) => {
            return [this.props.selectElement && this._store.capabilities.dom && {
              key: 'findDOMNode',
              title: 'Find the DOM node',
              action: () => this.sendSelection(id),
            }, this.props.showComponentSource && node.get('nodeType') === 'Composite' && {
              key: 'showComponentSource',
              title: 'Show ' + node.get('name') + ' source',
              action: () => this.viewComponentSource(id),
            }, this.props.showElementSource && node.get('source') && {
              key: 'showElementSource',
              title: 'Show <' + node.get('name') + ' /> in source',
              action: () => this.viewElementSource(id, node.get('source')),
            }];
          },
        }}
        extraPanes={extraPanes}
        extraTabs={extraTabs}
      />
    );
  }
}

Panel.childContextTypes = {
  store: React.PropTypes.object,
};

var panelRNStyle = (bridge, supportsMeasure) => (node, id) => {
  var props = node.get('props');
  if (!props || !props.style) {
    return <strong key="rnstyle">No style</strong>;
  }
  return (
    <div key="rnstyle">
      <h3>React Native Style Editor</h3>
      <NativeStyler id={id} bridge={bridge} supportsMeasure={supportsMeasure} />
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
  troubleshootingHint: {
    fontSize: 14,
  },
};

module.exports = Panel;
