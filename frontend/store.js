
import EventEmitter from 'events'
import {Map, Set} from 'immutable'

class Store extends EventEmitter {
  constructor(bridge) {
    super()
    this.data = new Map();
    this.roots = new Set();
    this.bridge = bridge;
    this.hovered = null;
    this.selected = null;
    this.bridge.on('root', id => {
      console.log('got rot');
      this.roots = this.roots.add(id);
      this.emit('roots');
      if (!this.selected) {
        this.selected = id;
        this.emit('selected');
      }
    });

    this.bridge.on('mount', (data) => {
      this.data = this.data.set(data.id, Map(data));
      this.emit(data.id);
    });
  }

  get(id) {
    return this.data.get(id);
  }

  off(evt, fn) {
    this.removeListener(evt, fn);
  }

  toggleCollapse(id) {
    this.data = this.data.updateIn([id, 'collapsed'], c => !c);
    this.emit(id);
  }

  setHover(id, isHovered) {
    if (isHovered) {
      var old = this.hovered;
      this.hovered = id;
      if (old) {
        this.emit(old);
      }
      this.emit(id);
      this.emit('hover');
    } else if (this.hovered === id) {
      this.hovered = null;
      this.emit(id);
      this.emit('hover');
    }
  }

  select(id) {
    var oldSel = this.selected;
    this.selected = id;
    if (oldSel) {
      this.emit(oldSel);
    }
    this.emit(id);
    this.emit('selected');
  }

  addRoot(id) {
    this.roots = this.roots.add(id);
    this.emit('roots');
  }

  addComponent(id, data) {
    this.data = this.data.set(id, data);
  }

  updateComponent(id, data) {
    this.data = this.data.set(id, data);
    this.emit(id);
  }

  removeComponent(id) {
    var parent = this.data.getIn([id, 'parent']);
    this.data = this.data.delete(id);
    this.emit(parent || 'roots');
  }
}

module.exports = Store;
