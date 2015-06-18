
import EventEmitter from 'events'
import assign from 'object-assign'

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

class Backend extends EventEmitter {
  constructor(bridge, global) {
    super();
    this.global = global;
    this.nodes = new Map();
    this.roots = new Set();
    this.ids = new WeakMap();
    this.comps = new Map();
    this.bridge = bridge
    this.bridge.on('setState', this._setState.bind(this));
    this.bridge.on('makeGlobal', this._makeGlobal.bind(this));
  }

  _setState({id, path, value}) {
    var data = this.nodes.get(id);
    setIn(data.state, path, value);
    if (data.updater && data.updater.forceUpdate) {
      data.updater.forceUpdate();
      this.onUpdated(this.comps.get(id), data);
    } else {
      console.warn("trying to set state on a component that doesn't support it");
    }
  }

  _makeGlobal({id, path}) {
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

  setEnabled(val) {
    throw new Error("React hasn't injected... what's up?");
  }

  getId(element) {
    if ('object' !== typeof element) {
      return element;
    }
    if (!this.ids.has(element)) {
      this.ids.set(element, randid());
      this.comps.set(this.ids.get(element), element);
    }
    return this.ids.get(element);
  }

  addRoot(element) {
    var id = this.getId(element);
    this.roots.add(id);
    this.bridge.send('root', id);
  }

  onMounted(component, data) {
    var id = this.getId(component);
    this.nodes.set(id, data);

    var send = assign({}, data);
    if (send.children && send.children.map) {
      send.children = send.children.map(c => this.getId(c));
    }
    send.id = id;
    delete send.type;
    delete send.updater;
    this.bridge.send('mount', send);
  }

  onUpdated(component, data) {
    var id = this.getId(component);
    this.nodes.set(id, data);

    var send = assign({}, data);
    if (send.children && send.children.map) {
      send.children = send.children.map(c => this.getId(c));
    }
    send.id = id;
    delete send.type;
    delete send.updater;
    this.bridge.send('update', send)
  }

  onUnmounted(component) {
    var id = this.getId(component);
    this.nodes.delete(id);
    this.roots.delete(id);
    this.bridge.send('unmount', id);
    this.bridge.forget(id);
    this.ids.delete(component);
  }
}

module.exports = Backend
