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

/* globals chrome */

const PropTypes = require('prop-types');
const React = require('react');
const Container = require('./Container');
const Store = require('./Store');
const keyboardNav = require('./keyboardNav');
const invariant = require('./invariant');
const assign = require('object-assign');

const Bridge = require('../agent/Bridge');
const {sansSerif} = require('./Themes/Fonts');
const NativeStyler = require('../plugins/ReactNativeStyle/ReactNativeStyle.js');
const ProfilerPlugin = require('../plugins/Profiler/ProfilerPlugin');
const Themes = require('./Themes/Themes');
const ThemeStore = require('./Themes/Store');

const consts = require('../agent/consts');

import type {Theme} from './types';
import type {DOMEvent} from './types';
import type {Wall} from '../agent/Bridge';

export type Props = {
  alreadyFoundReact: boolean,
  browserName?: string,
  showInspectButton?: boolean,
  showHiddenThemes?: boolean,
  themeName?: string,
  inject: (done: (wall: Wall, onDisconnect?: () => void) => void) => void,
  preferencesPanelShown?: boolean,

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
  preferencesPanelShown: boolean,
  showUpgradeMessage: boolean,
  themeKey: number,
  themeName: ?string,
  showTroubleshooting: boolean,
};

class Panel extends React.Component<Props, State> {
  _teardownWall: ?() => void;
  _keyListener: ?(e: DOMEvent) => void;
  // eslint shouldn't error on type positions. TODO: update eslint
  // eslint-disable-next-line no-undef
  _checkTimeout: ?TimeoutID;
  _troubleshootingTimeout: ?TimeoutID; // eslint-disable-line no-undef
  _unMounted: boolean;
  _bridge: Bridge;
  _store: Store;
  _themeStore: ThemeStore;
  _unsub: ?() => void;
  // TODO: typecheck plugin interface
  plugins: Array<any>;

  defaultProps: DefaultProps;

  constructor(props: Props) {
    super(props);
    this.state = {
      loading: true,
      showTroubleshooting: false,
      preferencesPanelShown: false,
      isReact: props.alreadyFoundReact,
      showUpgradeMessage: false,
      themeKey: 0,
      themeName: props.themeName,
    };
    this._unMounted = false;
    window.panel = this;
    this.plugins = [];
  }

  getChildContext(): Object {
    return {
      browserName: this.props.browserName || '',
      defaultThemeName: this._themeStore && this._themeStore.defaultThemeName || '',
      showHiddenThemes: !!this.props.showHiddenThemes,
      showInspectButton: this.props.showInspectButton !== false,
      store: this._store,
      theme: this._themeStore && this._themeStore.theme || Themes.ChromeDefault,
      themeName: this._themeStore && this._themeStore.themeName || '',
      themes: this._themeStore && this._themeStore.themes || {},
    };
  }

  componentDidMount() {
    if (this.props.alreadyFoundReact) {
      this.inject();
    } else {
      this.lookForReact();
    }

    if (this.props.showUpgradeMessageIfModernBackendDetected) {
      let removeListener = this._bridge.wall.listen(message => {
        switch ((message: any).event) {
          case 'isBackendStorageAPISupported':
          case 'isNativeStyleEditorSupported':
          case 'operations':
          case 'overrideComponentFilters':
            // Any of these is sufficient to indicate a newer backend version.
            if (typeof removeListener === 'function') {
              removeListener();
              removeListener = null;
            }
            this.setState({ showUpgradeMessage: true });
            break;
        }

        // If we've detected an old backend though, it's safe to unsubscribe.
        switch (message.type) {
          case 'call':
          case 'event':
          case 'many-events':
            // Any of these types indicate the v3 backend.
            if (typeof removeListener === 'function') {
              removeListener();
              removeListener = null;
            }
            break;
        }
      });
    }

    if (this.props.reloadSubscribe) {
      this._unsub = this.props.reloadSubscribe(() => this.reload());
    }

    if (this.state.loading) {
      this._troubleshootingTimeout = setTimeout(
        () => this.setState({showTroubleshooting: true}),
        3000
      );
    }
  }

  componentWillUnmount() {
    this._unMounted = true;
    if (this._unsub) {
      this._unsub();
    }
    this.teardown();

    if (this._troubleshootingTimeout !== null) {
      clearTimeout(this._troubleshootingTimeout);
    }
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

      this._themeStore = new ThemeStore(this.state.themeName);
      this._store = new Store(this._bridge, this._themeStore);

      var refresh = () => this.forceUpdate();
      this.plugins = [
        new ProfilerPlugin(this._store, this._bridge, refresh),
      ];

      this._keyListener = keyboardNav(this._store, window);

      window.addEventListener('keydown', this._keyListener);

      this._store.on('connected', () => {
        this.setState({
          loading: false,
          themeName: this._themeStore.themeName,
        });
        this.getNewSelection();
      });
      this._store.on('preferencesPanelShown', () => {
        this.setState({
          preferencesPanelShown: this._store.preferencesPanelShown,
        });
      });
      this._store.on('theme', () => {
        // Force a deep re-render when theme changes.
        // Use an incrementor so changes to Custom theme also update.
        this.setState(state => ({
          themeKey: state.themeKey + 1,
          themeName: this._themeStore.theme.displayName,
        }));
      });
    });
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (!this.state.isReact) {
      if (!this._checkTimeout) {
        this._checkTimeout = setTimeout(() => {
          this._checkTimeout = null;
          this.lookForReact();
        }, 200);
      }
    }

    if (prevState.loading && !this.state.loading) {
      if (this._troubleshootingTimeout !== null) {
        clearTimeout(this._troubleshootingTimeout);
      }
    } else if (!prevState.loading && this.state.loading) {
      this._troubleshootingTimeout = setTimeout(
        () => this.setState({showTroubleshooting: true}),
        3000
      );
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
    var theme = this._store ? this._themeStore.theme : Themes.ChromeDefault;
    if (this.state.showUpgradeMessage) {
      return (
        <div style={loadingStyle(theme)}>
          <h2>DevTools v3 is incompatible with this version of React</h2>
          <br />
          <p>Upgrade to the latest React DevTools:</p>
          <code style={codeStyle(theme)}>npm install -d react-devtools</code>
        </div>
      );
    } else if (this.state.loading) {
      // TODO: This currently shows in the Firefox shell when navigating from a
      // React page to a non-React page. We should show a better message but
      // properly doing so probably requires refactoring how we load the panel
      // and communicate with the bridge.
      return (
        <div style={loadingStyle(theme)}>
          <h2>Connecting to React…</h2>
          <br />
          {this.state.showTroubleshooting && (
            <a style={{
              color: 'gray',
              textDecoration: 'underline',
              cursor: 'pointer',
            }} onClick={() => {
              chrome.tabs.create({
                active: true,
                url: 'https://github.com/facebook/react-devtools/blob/master/' +
                  'README.md#the-react-tab-doesnt-show-up',
              });
            }}>
              Click here for troubleshooting instructions
            </a>
          )}
        </div>
      );
    }
    if (!this.state.isReact) {
      return (
        <div style={loadingStyle(theme)}>
          <h2>Looking for React…</h2>
        </div>
      );
    }
    var extraTabs = assign.apply(null, [{}].concat(this.plugins.map(p => p.tabs())));
    var extraPanes = [].concat(...this.plugins.map(p => p.panes()));
    if (this._store.capabilities.rnStyle) {
      extraPanes.push(panelRNStyle(this._bridge, this._store.capabilities.rnStyleMeasure, theme));
    }
    return (
      <Container
        key={this.state.themeKey /* Force deep re-render when theme changes */}
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
        preferencesPanelShown={this.state.preferencesPanelShown}
        theme={theme}
        onViewElementSource={
          this.props.showElementSource ? this.viewElementSource.bind(this) : null
        }
      />
    );
  }
}

Panel.childContextTypes = {
  browserName: PropTypes.string.isRequired,
  defaultThemeName: PropTypes.string.isRequired,
  showHiddenThemes: PropTypes.bool.isRequired,
  showInspectButton: PropTypes.bool.isRequired,
  store: PropTypes.object,
  theme: PropTypes.object.isRequired,
  themeName: PropTypes.string.isRequired,
  themes: PropTypes.object.isRequired,
};

var panelRNStyle = (bridge, supportsMeasure, theme) => (node, id) => {
  var props = node.get('props');
  if (!props || !props.style) {
    return (
      <div key="rnstyle" style={containerStyle(theme)}>
        <strong>No style</strong>
      </div>
    );
  }
  return (
    <div key="rnstyle" style={containerStyle(theme)}>
      <strong>React Native Style Editor</strong>
      <NativeStyler id={id} bridge={bridge} supportsMeasure={supportsMeasure} />
    </div>
  );
};

const codeStyle = (theme: Theme) => ({
  backgroundColor: theme.base01,
  color: theme.base05,
  borderRadius: '0.125rem',
  padding: '0.25rem 0.5rem',
});

const containerStyle = (theme: Theme) => ({
  borderTop: `1px solid ${theme.base01}`,
  padding: '0.25rem',
  marginBottom: '0.25rem',
  flexShrink: 0,
});
const loadingStyle = (theme: Theme) => ({
  fontFamily: sansSerif.family,
  fontSize: sansSerif.sizes.large,
  textAlign: 'center',
  padding: 30,
  flex: 1,

  // This color is hard-coded to match app.html and standalone.js
  // Without it, the loading headers change colors and look weird
  color: '#aaa',
});

module.exports = Panel;
