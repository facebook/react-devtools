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

var {EventEmitter} = require('events');
var assign = require('object-assign');

import type * as Bridge from './Bridge';
import type {DataType, OpaqueReactElement, NativeType} from '../backend/types';

type Bridge = {
  send: (evt: string, data?: any) => void,
  on: (evt: string, fn: (data: any) => any) => void,
  forget: (id: string) => void,
};

type InternalsObject = {
  getNativeFromReactElement: (el: OpaqueReactElement) => NativeType,
  getReactElementFromNative: (node: NativeType) => OpaqueReactElement,
  cleanup: () => void,
};

/**
 * Events from React:
 * - root (got a root)
 * - mount (a component mounted)
 * - update (a component updated)
 * - unmount (a component mounted)
 */
class Agent extends EventEmitter {
  reactElements: Map<string, OpaqueReactElement>;
  global: Object;
  ids: WeakMap<OpaqueReactElement, string>;
  elementData: Map<string, DataType>;
  roots: Set<string>;
  reactInternals: {[key: string]: InternalsObject}; // injected
  capabilities: {[key: string]: boolean};
  renderers: Map<string, string>;
  _prevSelected: any;

  constructor(global: Object, capabilities?: Object) {
    super();
    this.global = global;
    this.reactElements = new Map();
    this.ids = new WeakMap();
    this.renderers = new Map();
    this.elementData = new Map();
    this.roots = new Set();
    this.reactInternals = {};
    this.on('selected', id => {
      var data = this.elementData.get(id);
      if (data && data.publicInstance) {
        this.global.$r = data.publicInstance;
      }
    });
    this._prevSelected = null;
    var isReactDOM = window.document && typeof window.document.createElement === 'function';
    this.capabilities = assign({
      scroll: isReactDOM && typeof window.document.body.scrollIntoView === 'function',
      dom: isReactDOM,
      editTextContent: false,//isReactDOM,
    }, capabilities);
  }

  // return "unsubscribe" function
  sub(ev: string, fn: (data: any) => void): () => void {
    EventEmitter.prototype.on.call(this, ev, fn);
    return () => this.off(ev, fn);
  }

  off(ev: string, fn: (data: any) => void) {
    this.removeListener(ev, fn);
  }

  setReactInternals(renderer: string, reactInternals: InternalsObject) {
    this.reactInternals[renderer] = reactInternals;
  }

  addBridge(bridge: Bridge) {
    bridge.on('setState', this._setState.bind(this));
    bridge.on('setProps', this._setProps.bind(this));
    bridge.on('setContext', this._setContext.bind(this));
    bridge.on('makeGlobal', this._makeGlobal.bind(this));
    bridge.on('highlight', id => this.highlight(id));
    bridge.on('highlightMany', id => this.highlightMany(id));
    bridge.on('hideHighlight', () => this.emit('hideHighlight'));
    bridge.on('selected', id => this.emit('selected', id));
    bridge.on('changeTextContent', ({id, text}) => {
      var node = this.getNodeForID(id);
      if (!node) {
        return;
      }
      node.textContent = text;
    });
    bridge.on('shutdown', () => {
      this.emit('shutdown');
    });
    bridge.on('putSelectedNode', id => {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$node = this.getNodeForID(id);
    });
    bridge.on('putSelectedInstance', id => {
      var node = this.elementData.get(id);
      if (node.publicInstance) {
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$inst = node.publicInstance;
      } else {
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$inst = null;
      }
    });
    bridge.on('checkSelection', () => {
      var newSelected = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$0;
      if (newSelected !== this._prevSelected) {
        this._prevSelected = newSelected;
        var sentSelected = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$node;
        if (newSelected !== sentSelected) {
          this.selectFromDOMNode(newSelected, true);
        }
      }
    });
    bridge.on('requestCapabilities', () => {
      bridge.send('capabilities', this.capabilities);
      this.emit('connected');
    });
    bridge.on('scrollToNode', id => this.scrollToNode(id));
    this.on('root', id => bridge.send('root', id));
    this.on('mount', data => bridge.send('mount', data));
    this.on('update', data => bridge.send('update', data));
    this.on('unmount', id => {
      bridge.send('unmount', id);
      bridge.forget(id);
    });
    this.on('setSelection', data => bridge.send('select', data));
  }

  scrollToNode(id: string): void {
    var node = this.getNodeForID(id);
    if (!node) {
      console.warn('unable to get the node for scrolling');
      return;
    }
    if (node.scrollIntoViewIfNeeded) {
      node.scrollIntoViewIfNeeded();
    } else {
      node.scrollIntoView();
    }
    this.highlight(id);
  }

  highlight(id: string) {
    var data = this.elementData.get(id);
    var node = this.getNodeForID(id);
    if (node) {
      this.emit('highlight', {node, name: data.name, props: data.props});
    }
  }

  highlightMany(ids: Array<string>) {
    var nodes = [];
    ids.forEach(id => {
      var node = this.getNodeForID(id);
      if (node) {
        nodes.push(node);
      }
    });
    if (nodes.length) {
      this.emit('highlightMany', nodes);
    }
  }

  getNodeForID(id: string): ?Object {
    var component = this.reactElements.get(id);
    if (!component) {
      return null;
    }
    var data = this.elementData.get(id);
    if (!data) {
      return null;
    }
    var renderer = this.renderers.get(id);
    if (!this.reactInternals[renderer]) {
      return null;
    }
    if (this.reactInternals[renderer].getNativeFromReactElement) {
      return this.reactInternals[renderer].getNativeFromReactElement(component);
    }
  }

  selectFromDOMNode(node: Object, quiet?: boolean) {
    var id = this.getIDForNode(node);
    if (!id) {
      return;
    }
    this.emit('setSelection', {id, quiet});
  }

  selectFromReactInstance(instance: OpaqueReactElement, quiet?: boolean) {
    var id = this.getId(instance);
    if (!id) {
      console.log('no instance id', instance);
      return;
    }
    this.emit('setSelection', {id, quiet});
  }

  getIDForNode(node: Object): ?string {
    if (!this.reactInternals) {
      return null;
    }
    var component;
    for (var renderer in this.reactInternals) {
      try {
        component = this.reactInternals[renderer].getReactElementFromNative(node);
      } catch (e){}
      if (component) {
        return this.getId(component);
      }
    }
  }

  setEnabled(val: boolean): Object {
    throw new Error("React hasn't injected... what's up?");
  }

  _setProps({id, path, value}: {id: string, path: Array<string>, value: any}) {
    var data = this.elementData.get(id);
    if (data.updater && data.updater.setInProps) {
      data.updater.setInProps(path, value);
    } else {
      console.warn("trying to set props on a component that doesn't support it");
    }
  }

  _setState({id, path, value}: {id: string, path: Array<string>, value: any}) {
    var data = this.elementData.get(id);
    if (data.updater && data.updater.setInState) {
      data.updater.setInState(path, value);
    } else {
      console.warn("trying to set state on a component that doesn't support it");
    }
  }

  _setContext({id, path, value}: {id: string, path: Array<string>, value: any}) {
    var data = this.elementData.get(id);
    if (data.updater && data.updater.setInContext) {
      data.updater.setInContext(path, value);
    } else {
      console.warn("trying to set state on a component that doesn't support it");
    }
  }

  _makeGlobal({id, path}: {id: string, path: Array<string>}) {
    var data = this.elementData.get(id);
    var value;
    if (path === 'instance') {
      value = data.publicInstance;
    } else {
      value = getIn(data, path);
    }
    this.global.$tmp = value;
    console.log('$tmp =', value);
  }

  getId(element: OpaqueReactElement): string {
    if (typeof element !== 'object') {
      return element;
    }
    if (!this.ids.has(element)) {
      this.ids.set(element, randid());
      this.reactElements.set(this.ids.get(element), element);
    }
    return this.ids.get(element);
  }

  addRoot(renderer: string, element: OpaqueReactElement) {
    var id = this.getId(element);
    this.roots.add(id);
    this.emit('root', id);
  }

  onMounted(renderer: string, component: OpaqueReactElement, data: DataType) {
    var id = this.getId(component);
    this.renderers.set(id, renderer);
    this.elementData.set(id, data);

    var send = assign({}, data);
    if (send.children && send.children.map) {
      send.children = send.children.map(c => this.getId(c));
    }
    send.id = id;
    send.canUpdate = send.updater && !!send.updater.forceUpdate;
    delete send.type;
    delete send.updater;
    this.emit('mount', send);
  }

  onUpdated(component: OpaqueReactElement, data: DataType) {
    var id = this.getId(component);
    this.elementData.set(id, data);

    var send = assign({}, data);
    if (send.children && send.children.map) {
      send.children = send.children.map(c => this.getId(c));
    }
    send.id = id;
    send.canUpdate = send.updater && !!send.updater.forceUpdate;
    delete send.type;
    delete send.updater;
    this.emit('update', send);
  }

  onUnmounted(component: OpaqueReactElement) {
    var id = this.getId(component);
    this.elementData.delete(id);
    this.roots.delete(id);
    this.renderers.delete(id);
    this.emit('unmount', id);
    this.ids.delete(component);
  }
}

function randid() {
  return Math.random().toString(0x0f).slice(10, 20);
}

function getIn(base, path) {
  return path.reduce((obj, attr) => {
    return obj ? obj[attr] : null;
  }, base);
}

module.exports = Agent;
