
import EventEmitter from 'events'
import assign from 'object-assign'

function randid() {
  return Math.random().toString(0x0f).slice(10, 20)
}

class Backend extends EventEmitter {
  constructor(bridge) {
    super()
    this.nodes = new WeakMap();
    this.roots = new Set();
    this.ids = new WeakMap();
    this.bridge = bridge
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
    }
    return this.ids.get(element);
  }

  addRoot(element) {
    this.roots.add(element);
    // this.emit('root');
    this.bridge.send('root', this.getId(element));
  }

  onMounted(component, data) {
    this.nodes.set(component, data);

    var id = this.getId(component);
    var send = assign({}, data);
    if (send.children && send.children.map) {
      send.children = send.children.map(c => this.getId(c));
    }
    send.id = id;
    this.bridge.send('mount', send);
  }

  onUpdated(component, data) {
    this.nodes.set(component, data);

    var id = this.getId(component);
    var send = assign({}, data);
    if (send.children && send.children.map) {
      send.children = send.children.map(c => this.getId(c));
    }
    send.id = id;
    this.bridge.send('update', send)
  }

  onUnmounted(component) {
    this.nodes.delete(component);
    this.roots.delete(component);
    // this.emit('update', component);
    this.bridge.send('unmount', this.getId(component));
    this.bridge.forgetComplex(this.getId(component));
    this.ids.delete(component);
  }
}

module.exports = Backend
