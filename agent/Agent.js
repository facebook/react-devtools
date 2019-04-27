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
var nullthrows = require('nullthrows').default;
var guid = require('../utils/guid');
var getIn = require('./getIn');

import type {RendererID, DataType, OpaqueNodeHandle, NativeType, Helpers} from '../backend/types';

type ElementID = string;

import type Bridge from './Bridge';

/**
 * The agent lives on the page in the same context as React, observes events
 * from the `backend`, and communicates (via a `Bridge`) with the frontend.
 *
 * It is responsible for generating string IDs (ElementID) for each react
 * element, maintaining a mapping of those IDs to elements, handling messages
 * from the frontend, and translating between react elements and native
 * handles.
 *
 *
 *   React
 *     |
 *     v
 *  backend
 *     |
 *     v
 *  -----------
 * | **Agent** |
 *  -----------
 *     ^
 *     |
 *     v
 *  (Bridge)
 *     ^
 *     |
 * serialization
 *     |
 *     v
 *  (Bridge)
 *     ^
 *     |
 *     v
 *  ----------------
 * | Frontend Store |
 *  ----------------
 *
 *
 * Events from the `backend`:
 * - root (got a root)
 * - mount (a component mounted)
 * - update (a component updated)
 * - unmount (a component mounted)
 *
 * Events from the `frontend` Store:
 * - see `addBridge` for subscriptions
 *
 * Events that Agent fires:
 * - selected
 * - hideHighlight
 * - startInspecting
 * - stopInspecting
 * - shutdown
 * - highlight /highlightMany
 * - setSelection
 * - root
 * - mount
 * - update
 * - unmount
 */
class Agent extends EventEmitter {
  // the window or global -> used to "make a value available in the console"
  global: Object;
  internalInstancesById: Map<ElementID, OpaqueNodeHandle>;
  idsByInternalInstances: WeakMap<OpaqueNodeHandle, ElementID>;
  renderers: Map<ElementID, RendererID>;
  elementData: Map<ElementID, DataType>;
  roots: Set<ElementID>;
  reactInternals: {[key: RendererID]: Helpers};
  _prevSelected: ?NativeType;
  _scrollUpdate: boolean;
  capabilities: {[key: string]: boolean};
  _updateScroll: () => void;
  _inspectEnabled: boolean;

  constructor(global: Object, capabilities?: Object) {
    super();
    this.global = global;
    this.internalInstancesById = new Map();
    this.idsByInternalInstances = new WeakMap();
    this.renderers = new Map();
    this.elementData = new Map();
    this.roots = new Set();
    this.reactInternals = {};
    var lastSelected;
    this.on('selected', id => {
      var data = this.elementData.get(id);
      if (data) {
        if (data.publicInstance && this.global.$r === lastSelected) {
          this.global.$r = data.publicInstance;
          lastSelected = data.publicInstance;
        }
      }
    });
    this._prevSelected = null;
    this._scrollUpdate = false;
    var isReactDOM = window.document && typeof window.document.createElement === 'function';
    this.capabilities = assign({
      scroll: isReactDOM && typeof window.document.body.scrollIntoView === 'function',
      dom: isReactDOM,
      editTextContent: false,
    }, capabilities);

    if (isReactDOM) {
      this._updateScroll = this._updateScroll.bind(this);
      window.addEventListener('scroll', this._onScroll.bind(this), true);
      window.addEventListener('click', this._onClick.bind(this), true);
      window.addEventListener('mouseover', this._onMouseOver.bind(this), true);
      window.addEventListener('resize', this._onResize.bind(this), true);
    }
  }

  // returns an "unsubscribe" function
  sub(ev: string, fn: (data: any) => void): () => void {
    this.on(ev, fn);
    return () => {
      this.removeListener(ev, fn);
    };
  }

  setReactInternals(renderer: RendererID, reactInternals: Helpers) {
    this.reactInternals[renderer] = reactInternals;
  }

  addBridge(bridge: Bridge) {
    /** Events received from the frontend **/
    // the initial handshake
    bridge.on('requestCapabilities', () => {
      bridge.send('capabilities', this.capabilities);
      this.emit('connected');
    });
    bridge.on('setState', this._setState.bind(this));
    bridge.on('setProps', this._setProps.bind(this));
    bridge.on('setContext', this._setContext.bind(this));
    bridge.on('makeGlobal', this._makeGlobal.bind(this));
    bridge.on('highlight', id => this.highlight(id));
    bridge.on('highlightMany', id => this.highlightMany(id));
    bridge.on('hideHighlight', () => this.emit('hideHighlight'));
    bridge.on('startInspecting', () => this.emit('startInspecting'));
    bridge.on('stopInspecting', () => this.emit('stopInspecting'));
    bridge.on('selected', id => this.emit('selected', id));
    bridge.on('isRecording', isRecording => this.emit('isRecording', isRecording));
    bridge.on('setInspectEnabled', enabled => {
      this._inspectEnabled = enabled;
      this.emit('stopInspecting');
    });
    bridge.on('shutdown', () => this.emit('shutdown'));
    bridge.on('changeTextContent', ({id, text}) => {
      var node = this.getNodeForID(id);
      if (!node) {
        return;
      }
      node.textContent = text;
    });
    // used to "inspect node in Elements pane"
    bridge.on('putSelectedNode', id => {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$node = this.getNodeForID(id);
    });
    // used to "view source in Sources pane"
    bridge.on('putSelectedInstance', id => {
      var node = this.elementData.get(id);
      if (node) {
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$type = node.type;
      } else {
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$type = null;
      }
      if (node && node.publicInstance) {
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$inst = node.publicInstance;
      } else {
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$inst = null;
      }
    });
    // used to select the inspected node ($0)
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
    bridge.on('scrollToNode', id => this.scrollToNode(id));
    bridge.on('traceupdatesstatechange', value => this.emit('traceupdatesstatechange', value));
    bridge.on('colorizerchange', value => this.emit('colorizerchange', value));

    /** Events sent to the frontend **/
    this.on('root', id => bridge.send('root', id));
    this.on('mount', data => bridge.send('mount', data));
    this.on('update', data => bridge.send('update', data));
    this.on('updateProfileTimes', data => bridge.send('updateProfileTimes', data));
    this.on('unmount', id => {
      bridge.send('unmount', id);
      // once an element has been unmounted, the bridge doesn't need to be
      // able to inspect it anymore.
      bridge.forget(id);
    });
    this.on('setSelection', data => bridge.send('select', data));
    this.on('setInspectEnabled', data => bridge.send('setInspectEnabled', data));
    this.on('isRecording', isRecording => bridge.send('isRecording', isRecording));
    this.on('storeSnapshot', (data) => bridge.send('storeSnapshot', data));
    this.on('clearSnapshots', () => bridge.send('clearSnapshots'));
  }

  scrollToNode(id: ElementID): void {
    var node = this.getNodeForID(id);
    if (!node) {
      console.warn('unable to get the node for scrolling');
      return;
    }
    var domElement = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!domElement) {
      console.warn('unable to get the domElement for scrolling');
      return;
    }

    if (typeof domElement.scrollIntoViewIfNeeded === 'function') {
      domElement.scrollIntoViewIfNeeded();
    } else if (typeof domElement.scrollIntoView === 'function') {
      domElement.scrollIntoView();
    }
    this.highlight(id);
  }

  highlight(id: ElementID) {
    var data = this.elementData.get(id);
    var node = this.getNodeForID(id);
    if (data && node) {
      this.emit('highlight', {node, name: data.name, props: data.props});
    }
  }

  highlightMany(ids: Array<ElementID>) {
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

  getNodeForID(id: ElementID): ?Object {
    var component = this.internalInstancesById.get(id);
    if (!component) {
      return null;
    }
    var renderer = this.renderers.get(id);
    if (renderer && this.reactInternals[renderer].getNativeFromReactElement) {
      return this.reactInternals[renderer].getNativeFromReactElement(component);
    }
    return null;
  }

  selectFromDOMNode(node: Object, quiet?: boolean, offsetFromLeaf: ?number = 0) {
    var id = this.getIDForNode(node);
    if (!id) {
      return;
    }
    this.emit('setSelection', {id, quiet, offsetFromLeaf});
  }

  // TODO: remove this method because it's breaking encapsulation.
  // It was used by RN inspector but this required leaking Fibers to it.
  // RN inspector will use selectFromDOMNode() instead now.
  // Remove this method in a few months after this comment was added.
  selectFromReactInstance(instance: OpaqueNodeHandle, quiet?: boolean) {
    var id = this.getId(instance);
    if (!id) {
      console.log('no instance id', instance);
      return;
    }
    this.emit('setSelection', {id, quiet});
  }

  getIDForNode(node: Object): ?ElementID {
    if (!this.reactInternals) {
      return null;
    }
    var component;
    for (var renderer in this.reactInternals) {
      // If a renderer doesn't know about a reactId, it will throw an error.
      try {
        // $FlowFixMe possibly null - it's not null
        component = this.reactInternals[renderer].getReactElementFromNative(node);
      } catch (e) {}
      if (component) {
        return this.getId(component);
      }
    }
    return null;
  }

  _setProps({id, path, value}: {id: ElementID, path: Array<string>, value: any}) {
    var data = this.elementData.get(id);
    if (data && data.updater && typeof data.updater.setInProps === 'function') {
      data.updater.setInProps(path, value);
    } else {
      console.warn("trying to set props on a component that doesn't support it");
    }
  }

  _setState({id, path, value}: {id: ElementID, path: Array<string>, value: any}) {
    var data = this.elementData.get(id);
    if (data && data.updater && typeof data.updater.setInState === 'function') {
      data.updater.setInState(path, value);
    } else {
      console.warn("trying to set state on a component that doesn't support it");
    }
  }

  _setContext({id, path, value}: {id: ElementID, path: Array<string>, value: any}) {
    var data = this.elementData.get(id);
    if (data && data.updater && typeof data.updater.setInContext === 'function') {
      // $FlowFixMe
      data.updater.setInContext(path, value);
    } else {
      console.warn("trying to set context on a component that doesn't support it");
    }
  }

  _makeGlobal({id, path}: {id: ElementID, path: Array<string>}) {
    var data = this.elementData.get(id);
    if (!data) {
      return;
    }
    var value;
    if (path === 'instance') {
      value = data.publicInstance;
    } else {
      value = getIn(data, path);
    }
    this.global.$tmp = value;
    console.log('$tmp =', value);
  }

  getId(internalInstance: OpaqueNodeHandle): ElementID {
    if (typeof internalInstance !== 'object' || !internalInstance) {
      return internalInstance;
    }
    if (!this.idsByInternalInstances.has(internalInstance)) {
      this.idsByInternalInstances.set(internalInstance, guid());
      this.internalInstancesById.set(
        nullthrows(this.idsByInternalInstances.get(internalInstance)),
        internalInstance
      );
    }
    return nullthrows(this.idsByInternalInstances.get(internalInstance));
  }

  addRoot(renderer: RendererID, internalInstance: OpaqueNodeHandle) {
    var id = this.getId(internalInstance);
    this.roots.add(id);
    this.emit('root', id);
  }

  rootCommitted(renderer: RendererID, internalInstance: OpaqueNodeHandle, data: DataType) {
    var id = this.getId(internalInstance);
    this.emit('rootCommitted', id, internalInstance, data);
  }

  onMounted(renderer: RendererID, component: OpaqueNodeHandle, data: DataType) {
    var id = this.getId(component);
    this.renderers.set(id, renderer);
    this.elementData.set(id, data);

    var send = assign({}, data);
    if (send.children && send.children.map) {
      send.children = send.children.map(c => this.getId(c));
    }
    send.id = id;
    send.canUpdate = send.updater && send.updater.canUpdate;
    delete send.type;
    delete send.updater;
    this.emit('mount', send);
  }

  onUpdated(component: OpaqueNodeHandle, data: DataType) {
    var id = this.getId(component);
    this.elementData.set(id, data);

    var send = assign({}, data);
    if (send.children && send.children.map) {
      send.children = send.children.map(c => this.getId(c));
    }
    send.id = id;
    send.canUpdate = send.updater && send.updater.canUpdate;
    delete send.type;
    delete send.updater;
    this.emit('update', send);
  }

  onUpdatedProfileTimes(component: OpaqueNodeHandle, data: DataType) {
    var id = this.getId(component);
    this.elementData.set(id, data);

    var send = assign({}, data);
    if (send.children && send.children.map) {
      send.children = send.children.map(c => this.getId(c));
    }
    send.id = id;
    send.canUpdate = send.updater && send.updater.canUpdate;
    delete send.type;
    delete send.updater;
    this.emit('updateProfileTimes', send);
  }

  onUnmounted(component: OpaqueNodeHandle) {
    var id = this.getId(component);
    this.elementData.delete(id);
    if (this.roots.has(id)) {
      this.roots.delete(id);
      this.emit('rootUnmounted', id);
    }
    this.renderers.delete(id);
    this.emit('unmount', id);
    this.idsByInternalInstances.delete(component);
  }

  _onScroll() {
    if (!this._scrollUpdate) {
      this._scrollUpdate = true;
      window.requestAnimationFrame(this._updateScroll);
    }
  }

  _updateScroll() {
    this.emit('refreshMultiOverlay');
    this.emit('stopInspecting');
    this._scrollUpdate = false;
  }

  _onClick(event: Event) {
    if (!this._inspectEnabled) {
      return;
    }

    var id = this.getIDForNode(event.target);
    if (!id) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();

    this.emit('setSelection', {id});
    this.emit('setInspectEnabled', false);
  }

  _onMouseOver(event: Event) {
    if (this._inspectEnabled) {
      const id = this.getIDForNode(event.target);
      if (!id) {
        return;
      }

      this.highlight(id);
    }
  }

  _onResize(event: Event) {
    this.emit('stopInspecting');
  }
}

module.exports = Agent;
