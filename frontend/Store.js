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
var {Map, Set, List} = require('immutable');
var assign = require('object-assign');
var nodeMatchesText = require('./nodeMatchesText');
var consts = require('../agent/consts');
var invariant = require('./invariant');

import type Bridge from '../agent/Bridge';
import type {ControlState, DOMEvent, ElementID} from './types';

type ListenerFunction = () => void;
type DataType = Map;
type ContextMenu = {
  type: string,
  x: number,
  y: number,
  args: Array<any>,
};

const DEFAULT_PLACEHOLDER = 'Search by Component Name';

/**
 * This is the main frontend [fluxy?] Store, responsible for taking care of
 * state. It emits events when things change that you can subscribe to. The
 * best way to interact with the Store (if you are a React Component) is to
 * use the decorator in `decorate.js`. The top-level component (defined
 * by a shell) is generally responsible for creating the Store connecting it
 * up to a bridge, and putting it on `context` so the decorator can access it.
 *
 * Public events:
 *
 * - connected / connection failed
 * - roots
 * - searchText
 * - searchRoots
 * - contextMenu
 * - hover
 * - selected
 * - [node id]
 *
 * Public state:
 *  see attrs / constructor
 *
 * Public actions:
 * - scrollToNode(id)
 * - changeTextContent(id, text)
 * - changeSearch
 * - hoverClass
 * - selectFirstOfClass
 * - showContextMenu
 * - hideContextMenu
 * - selectFirstSearchResult
 * - toggleCollapse
 * - setProps/State/Context
 * - makeGlobal(id, path)
 * - setHover(id, isHovered)
 * - selectTop(id)
 * - selectBottom(id)
 * - select(id)
 *
 * Public methods:
 * - get(id) => Map (the node)
 * - getParent(id) => pid
 * - skipWrapper(id, up?) => id
 * - hasBottom(id) => bool
 * - on / off
 * - inspect(id, path, cb)
 */
class Store extends EventEmitter {
  _bridge: Bridge;
  _nodes: Map;
  _parents: Map;
  _nodesByName: Map;
  _eventQueue: Array<string>;
  _eventTimer: ?number;

  // Public state
  bananaslugState: ?ControlState;
  colorizerState: ?ControlState;
  regexState: ?ControlState;
  contextMenu: ?ContextMenu;
  hovered: ?ElementID;
  isBottomTagSelected: boolean;
  placeholderText: string;
  refreshSearch: boolean;
  roots: List;
  searchRoots: ?List;
  searchText: string;
  selectedTab: string;
  selected: ?ElementID;
  breadcrumbHead: ?ElementID;
  // an object describing the capabilities of the inspected runtime.
  capabilities: {
    scroll?: boolean,
  };

  constructor(bridge: Bridge) {
    super();
    this._nodes = new Map();
    this._parents = new Map();
    this._nodesByName = new Map();
    this._bridge = bridge;

    // Public state
    this.roots = new List();
    this.contextMenu = null;
    this.searchRoots = null;
    this.hovered = null;
    this.selected = null;
    this.selectedTab = 'Elements';
    this.breadcrumbHead = null;
    this.isBottomTagSelected = false;
    this.searchText = '';
    this.capabilities = {};
    this.bananaslugState = null;
    this.colorizerState = null;
    this.regexState = null;
    this.placeholderText = DEFAULT_PLACEHOLDER;
    this.refreshSearch = false;

    // for debugging
    window.store = this;

    // events from the backend
    this._bridge.on('root', id => {
      if (this.roots.contains(id)) {
        return;
      }
      this.roots = this.roots.push(id);
      if (!this.selected) {
        this.selected = this.skipWrapper(id);
        this.breadcrumbHead = this.selected;
        this.emit('selected');
        this.emit('breadcrumbHead');
        this._bridge.send('selected', this.selected);
      }
      this.emit('roots');
    });
    this._bridge.on('mount', (data) => this._mountComponent(data));
    this._bridge.on('update', (data) => this._updateComponent(data));
    this._bridge.on('unmount', id => this._unmountComponenent(id));
    this._bridge.on('select', ({id, quiet}) => {
      this._revealDeep(id);
      this.selectTop(this.skipWrapper(id), quiet);
      this.setSelectedTab('Elements');
    });

    this._establishConnection();
    this._eventQueue = [];
    this._eventTimer = null;
  }

  emit(event: string): boolean {
    if (this._eventQueue.indexOf(event) !== -1) {
      // to appease flow
      return true;
    }
    this._eventQueue.push(event);
    if (!this._eventTimer) {
      this._eventTimer = setTimeout(() => this.flush(), 50);
    }
    return true;
  }

  flush() {
    if (this._eventTimer) {
      clearTimeout(this._eventTimer);
      this._eventTimer = null;
    }
    this._eventQueue.forEach(evt => {
      EventEmitter.prototype.emit.call(this, evt);
    });
    this._eventQueue = [];
  }

  // Public actions
  scrollToNode(id: ElementID): void {
    this._bridge.send('scrollToNode', id);
  }

  setSelectedTab(name: string): void {
    if (this.selectedTab === name) {
      return;
    }
    this.selectedTab = name;
    this.emit('selectedTab');
  }

  // TODO(jared): get this working for react native
  changeTextContent(id: ElementID, text: string): void {
    this._bridge.send('changeTextContent', {id, text});
    var node = this._nodes.get(id);
    if (node.get('nodeType') === 'Text') {
      this._nodes = this._nodes.set(id, node.set('text', text));
    } else {
      this._nodes = this._nodes.set(id, node.set('children', text));
      var props = node.get('props');
      props.children = text;
    }
    this.emit(id);
  }

  changeSearch(text: string): void {
    var needle = text.toLowerCase();
    if (needle === this.searchText.toLowerCase() && !this.refreshSearch) {
      return;
    }
    if (!text) {
      this.searchRoots = null;
    } else {
      if (
        this.searchRoots &&
        needle.indexOf(this.searchText.toLowerCase()) === 0 &&
        (!this.regexState || !this.regexState.enabled)
      ) {
        this.searchRoots = this.searchRoots
          .filter(item => {
            var node = this.get(item);
            return (node.get('name') && node.get('name').toLowerCase().indexOf(needle) !== -1) ||
              (node.get('text') && node.get('text').toLowerCase().indexOf(needle) !== -1) ||
              (typeof node.get('children') === 'string' && node.get('children').toLowerCase().indexOf(needle) !== -1);
          });
      } else {
        this.searchRoots = this._nodes.entrySeq()
          .filter(([key, val]) => nodeMatchesText(val, needle, key, this))
          .map(([key, val]) => key)
          .toList();
      }
      this.searchRoots.forEach(id => {
        if (this.hasBottom(id)) {
          this._nodes = this._nodes.setIn([id, 'collapsed'], true);
        }
      });
    }
    this.searchText = text;
    this.emit('searchText');
    this.emit('searchRoots');
    if (this.searchRoots && !this.searchRoots.contains(this.selected)) {
      this.select(null, true);
    } else if (!this.searchRoots) {
      if (this.selected) {
        this._revealDeep(this.selected);
      } else {
        this.select(this.roots.get(0));
      }
    }

    this.highlightSearch();
    this.refreshSearch = false;

    // SearchPane input depends on this change being flushed synchronously.
    this.flush();
  }

  highlight(id: string): void {
    // Individual highlighting is disabled while colorizer is active
    if (!this.colorizerState || !this.colorizerState.enabled) {
      this._bridge.send('highlight', id);
    }
  }

  highlightMany(ids: Array<string>): void {
    this._bridge.send('highlightMany', ids);
  }

  highlightSearch(): void {
    if (this.colorizerState && this.colorizerState.enabled) {
      this._bridge.send('hideHighlight');
      if (this.searchRoots) {
        this.highlightMany(this.searchRoots.toArray());
      }
    }
  }

  hoverClass(name: string): void {
    if (name === null) {
      this.hideHighlight();
      return;
    }
    var ids = this._nodesByName.get(name);
    if (!ids) {
      return;
    }
    this.highlightMany(ids.toArray());
  }

  selectFirstOfClass(name: string): void {
    var ids = this._nodesByName.get(name);
    if (!ids || !ids.size) {
      return;
    }
    var id = ids.toSeq().first();
    this._revealDeep(id);
    this.selectTop(id);
  }

  showContextMenu(type: string, evt: DOMEvent, ...args: Array<any>) {
    evt.preventDefault();
    this.contextMenu = {type, x: evt.pageX, y: evt.pageY, args};
    this.emit('contextMenu');
  }

  hideContextMenu() {
    this.contextMenu = null;
    this.emit('contextMenu');
  }

  selectFirstSearchResult() {
    if (this.searchRoots) {
      this.select(this.searchRoots.get(0), true);
    }
  }

  hasBottom(id: ElementID): boolean {
    var node = this.get(id);
    var children = node.get('children');
    if (node.get('nodeType') === 'NativeWrapper') {
      children = this.get(children[0]).get('children');
    }
    if (typeof children === 'string' || !children || !children.length || node.get('collapsed')) {
      return false;
    }
    return true;
  }

  toggleCollapse(id: ElementID) {
    this._nodes = this._nodes.updateIn([id, 'collapsed'], c => !c);
    this.emit(id);
  }

  setProps(id: ElementID, path: Array<string>, value: any) {
    this._bridge.send('setProps', {id, path, value});
  }

  setState(id: ElementID, path: Array<string>, value: any) {
    this._bridge.send('setState', {id, path, value});
  }

  setContext(id: ElementID, path: Array<string>, value: any) {
    this._bridge.send('setContext', {id, path, value});
  }

  makeGlobal(id: ElementID, path: Array<string>) {
    this._bridge.send('makeGlobal', {id, path});
  }

  setHover(id: ElementID, isHovered: boolean) {
    if (isHovered) {
      var old = this.hovered;
      this.hovered = id;
      if (old) {
        this.emit(old);
      }
      this.emit(id);
      this.emit('hover');
      this.highlight(id);
    } else if (this.hovered === id) {
      this.hideHighlight();
    }
  }

  hideHighlight() {
    if (this.colorizerState && this.colorizerState.enabled) {
      return;
    }
    this._bridge.send('hideHighlight');
    if (!this.hovered) {
      return;
    }
    var id = this.hovered;
    this.hovered = null;
    this.emit(id);
    this.emit('hover');
  }

  selectBreadcrumb(id: ElementID) {
    this._revealDeep(id);
    this.changeSearch('');
    this.isBottomTagSelected = false;
    this.select(id, false, true);
  }

  selectTop(id: ?ElementID, noHighlight?: boolean) {
    this.isBottomTagSelected = false;
    this.select(id, noHighlight);
  }

  selectBottom(id: ElementID) {
    this.isBottomTagSelected = true;
    this.select(id);
  }

  select(id: ?ElementID, noHighlight?: boolean, keepBreadcrumb?: boolean) {
    var oldSel = this.selected;
    this.selected = id;
    if (oldSel) {
      this.emit(oldSel);
    }
    if (id) {
      this.emit(id);
    }
    if (!keepBreadcrumb) {
      this.breadcrumbHead = id;
      this.emit('breadcrumbHead');
    }
    this.emit('selected');
    this._bridge.send('selected', id);
    if (!noHighlight && id) {
      this.highlight(id);
    }
  }

  // Public methods
  get(id: ElementID): DataType {
    return this._nodes.get(id);
  }

  getParent(id: ElementID): ElementID {
    return this._parents.get(id);
  }

  skipWrapper(id: ElementID, up?: boolean): ?ElementID {
    if (!id) {
      return undefined;
    }
    var node = this.get(id);
    var nodeType = node.get('nodeType');
    if (nodeType !== 'Wrapper' && nodeType !== 'Native') {
      return id;
    }
    if (nodeType === 'Native' && (!up || this.get(this._parents.get(id)).get('nodeType') !== 'NativeWrapper')) {
      return id;
    }
    if (up) {
      return this._parents.get(id);
    }
    return node.get('children')[0];
  }

  off(evt: string, fn: ListenerFunction): void {
    this.removeListener(evt, fn);
  }

  inspect(id: ElementID, path: Array<string>, cb: () => void) {
    invariant(path[0] === 'props' || path[0] === 'state' || path[0] === 'context',
              'Inspected path must be one of props, state, or context');
    this._bridge.inspect(id, path, value => {
      var base = this.get(id).get(path[0]);
      var inspected = path.slice(1).reduce((obj, attr) => obj ? obj[attr] : null, base);
      if (inspected) {
        assign(inspected, value);
        inspected[consts.inspected] = true;
      }
      cb();
    });
  }

  changeBananaSlug(state: ControlState) {
    this.bananaslugState = state;
    this.emit('bananaslugchange');
    invariant(state.toJS);
    this._bridge.send('bananaslugchange', state.toJS());
  }

  changeColorizer(state: ControlState) {
    this.colorizerState = state;
    this.placeholderText = this.colorizerState.enabled
      ? 'Highlight by Component Name'
      : DEFAULT_PLACEHOLDER;
    this.emit('placeholderchange');
    this.emit('colorizerchange');
    this._bridge.send('colorizerchange', state.toJS());
    if (this.colorizerState && this.colorizerState.enabled) {
      this.highlightSearch();
    } else {
      this.hideHighlight();
    }
  }

  changeRegex(state: ControlState) {
    this.regexState = state;
    this.emit('regexchange');
    this.refreshSearch = true;
    this.changeSearch(this.searchText);
  }

  // Private stuff
  _establishConnection() {
    var tries = 0;
    var requestInt;
    this._bridge.once('capabilities', capabilities => {
      clearInterval(requestInt);
      this.capabilities = assign(this.capabilities, capabilities);
      this.emit('connected');
    });
    this._bridge.send('requestCapabilities');
    requestInt = setInterval(() => {
      tries += 1;
      if (tries > 100) {
        console.error('failed to connect');
        clearInterval(requestInt);
        this.emit('connection failed');
        return;
      }
      this._bridge.send('requestCapabilities');
    }, 500);
  }

  _revealDeep(id: ElementID) {
    if (this.searchRoots && this.searchRoots.contains(id)) {
      return;
    }
    var pid = this._parents.get(id);
    while (pid) {
      if (this._nodes.getIn([pid, 'collapsed'])) {
        this._nodes = this._nodes.setIn([pid, 'collapsed'], false);
        this.emit(pid);
      }
      if (this.searchRoots && this.searchRoots.contains(pid)) {
        return;
      }
      pid = this._parents.get(pid);
    }
  }

  _mountComponent(data: DataType) {
    var map = Map(data).set('renders', 1);
    if (data.nodeType === 'Composite') {
      map = map.set('collapsed', true);
    }
    this._nodes = this._nodes.set(data.id, map);
    if (data.children && data.children.forEach) {
      data.children.forEach(cid => {
        this._parents = this._parents.set(cid, data.id);
      });
    }
    var curNodes = this._nodesByName.get(data.name) || new Set();
    this._nodesByName = this._nodesByName.set(data.name, curNodes.add(data.id));
    this.emit(data.id);
  }

  _updateComponent(data: DataType) {
    var node = this.get(data.id);
    if (!node) {
      return;
    }
    data.renders = node.get('renders') + 1;
    this._nodes = this._nodes.mergeIn([data.id], Map(data));
    if (data.children && data.children.forEach) {
      data.children.forEach(cid => {
        if (!this._parents.get(cid)) {
          this._parents = this._parents.set(cid, data.id);
          var childNode = this._nodes.get(cid);
          var childID = childNode.get('id');
          if (
            this.searchRoots &&
            nodeMatchesText(
              childNode,
              this.searchText.toLowerCase(),
              childID,
              this,
          )) {
            this.searchRoots = this.searchRoots.push(childID);
            this.emit('searchRoots');
            this.highlightSearch();
          }
        }
      });
    }
    this.emit(data.id);
  }

  _unmountComponenent(id: ElementID) {
    var pid = this._parents.get(id);
    this._removeFromNodesByName(id);
    this._parents = this._parents.delete(id);
    this._nodes = this._nodes.delete(id);
    if (pid) {
      this.emit(pid);
    } else {
      var ix = this.roots.indexOf(id);
      if (ix !== -1) {
        this.roots = this.roots.delete(ix);
        this.emit('roots');
      }
    }
    if (id === this.selected) {
      var newsel = pid ? this.skipWrapper(pid, true) : this.roots.get(0);
      this.selectTop(newsel, true);
    }
    if (this.searchRoots && this.searchRoots.contains(id)) {
      // $FlowFixMe flow things searchRoots might be null
      this.searchRoots = this.searchRoots.delete(this.searchRoots.indexOf(id));
      this.emit('searchRoots');
      this.highlightSearch();
    }
  }

  _removeFromNodesByName(id: ElementID) {
    var node = this._nodes.get(id);
    if (node) {
      this._nodesByName = this._nodesByName.set(node.get('name'), this._nodesByName.get(node.get('name')).delete(id));
    }
  }
}

module.exports = Store;
