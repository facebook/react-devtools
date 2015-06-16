
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

class Backend extends EventEmitter {
  constructor(bridge) {
    super()
    this.nodes = new Map();
    this.roots = new Set();
    this.ids = new WeakMap();
    this.comps = new Map();
    this.bridge = bridge
    this.bridge.on('setState', ({id, path, value}) => {
      var data = this.nodes.get(id);
      setIn(data.state, path, value);
      var comp = this.comps.get(id);
      if (comp._instance) {
        comp._instance.forceUpdate();
      } else {
        debugger
      }
      this.onUpdated(this.comps.get(id), data);
    });
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
    this.bridge.send('update', send)
  }

  onUnmounted(component) {
    var id = this.getId(component);
    this.nodes.delete(id);
    this.roots.delete(id);
    // this.emit('update', component);
    this.bridge.send('unmount', id);
    // this.bridge.forgetComplex(id);
    this.ids.delete(component);
  }
}

module.exports = Backend
