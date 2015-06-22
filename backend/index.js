/** @flow **/

import {EventEmitter} from 'events'
import assign from 'object-assign'
import type * as Bridge from './bridge'

type Component = {};
type DataType = {
  type: string | Object,
  state: Object,
  props: Object,
  updater: {
    setState: (state: Object) => void,
    forceUpdate: () => void,
    publicInstance: Object,
  },
};

type Bridge = {
  send: (evt: string, data: any) => void,
  on: (evt: string, fn: (data: any) => void) => void,
  forget: (id: string) => void,
};

function randid() {
  return Math.random().toString(0x0f).slice(10, 20)
}

function setIn(obj, path, value) {
  path = path.slice();
  var name = path.pop();
  var child = path.reduce((obj, attr) => obj ? obj[attr] : null, obj);
  if (child === null) {
    return false;
  }
  child[name] = value;
  return true;
}

function getIn(obj, path) {
  return path.reduce((obj, attr) => {
    return obj ? obj[attr] : null;
  }, obj);
}

/**
 * Events from React:
 * - root (got a root)
 * - mount (a component mounted)
 * - update (a component updated)
 * - unmount (a component mounted)
 */
class Backend extends EventEmitter {
  comps: Map;
  global: Object;
  ids: WeakMap;
  nodes: Map;
  roots: Set;

  constructor(global: Object) {
    super();
    this.global = global;
    this.comps = new Map();
    this.ids = new WeakMap();
    this.nodes = new Map();
    this.roots = new Set();
    this.rootIDs = new Map();
    this.on('selected', id => {
      var data = this.nodes.get(id);
      if (data.updater) {
        this.global.$r = data.updater.publicInstance;
      }
    });
  }

  addBridge(bridge: Bridge) {
    bridge.on('setState', this._setState.bind(this));
    bridge.on('makeGlobal', this._makeGlobal.bind(this));
    bridge.on('highlight', id => {
      var node = this.getNodeForID(id);
      if (node) {
        this.emit('highlight', node);
      }
    });
    bridge.on('hideHighlight', () => this.emit('hideHighlight'));
    bridge.on('selected', id => this.emit('selected', id));
    this.on('root', id => bridge.send('root', id))
    this.on('mount', data => bridge.send('mount', data))
    this.on('update', data => bridge.send('update', data));
    this.on('unmount', id => {
      bridge.send('unmount', id)
      bridge.forget(id);
    });
    this.on('setSelection', id => bridge.send('select', id));
  }

  getNodeForID(id: string): ?Object {
    var component = this.comps.get(id);
    return this.reactFindDOMNode(component);
  }

  selectFromDOMNode(node: Object) {
    var id = this.getIDForNode(node);
    if (!id) {
      return;
    }
    this.emit('setSelection', id);
  }

  getIDForNode(node: Object): ?string {
    var reactID = this.reactIDFromDOM(node);
    return this.rootIDs.get(reactID);
  }

  setEnabled(val: boolean): Object {
    throw new Error("React hasn't injected... what's up?");
  }

  _setState({id, path, value}: {id: string, path: Array<string>, value: any}) {
    var data = this.nodes.get(id);
    setIn(data.state, path, value);
    if (data.updater && data.updater.forceUpdate) {
      data.updater.forceUpdate();
      this.onUpdated(this.comps.get(id), data);
    } else {
      console.warn("trying to set state on a component that doesn't support it");
    }
  }

  _makeGlobal({id, path}: {id: string, path: Array<string>}) {
    var data = this.nodes.get(id);
    var value;
    if (path === 'instance') {
      value = data.updater.publicInstance;
    } else {
      value = getIn(data, path);
    }
    this.global.$inspect = value;
    console.log('$inspect =', value);
  }

  getId(element: Component): string {
    if ('object' !== typeof element) {
      return element;
    }
    if (!this.ids.has(element)) {
      this.ids.set(element, randid());
      this.comps.set(this.ids.get(element), element);
    }
    return this.ids.get(element);
  }

  addRoot(element: Component) {
    var id = this.getId(element);
    this.roots.add(id);
    this.emit('root', id);
  }

  onMounted(component: Component, data: DataType) {
    var id = this.getId(component);
    this.nodes.set(id, data);

    this.rootIDs.set(component._rootNodeID, id);

    var send = assign({}, data);
    if (send.children && send.children.map) {
      send.children = send.children.map(c => this.getId(c));
    }
    send.id = id;
    delete send.type;
    delete send.updater;
    this.emit('mount', send);
  }

  onUpdated(component: Component, data: DataType) {
    var id = this.getId(component);
    this.nodes.set(id, data);

    var send = assign({}, data);
    if (send.children && send.children.map) {
      send.children = send.children.map(c => this.getId(c));
    }
    send.id = id;
    delete send.type;
    delete send.updater;
    this.emit('update', send)
  }

  onUnmounted(component: Component) {
    var id = this.getId(component);
    this.nodes.delete(id);
    this.roots.delete(id);
    this.emit('unmount', id);
    this.ids.delete(component);
  }
}

module.exports = Backend
