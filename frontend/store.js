
import EventEmitter from 'events'
import {Map, Set, List} from 'immutable'

import dirToDest from './dir-to-dest';

var keyCodes = {
  72: 'left',  // 'h',
  74: 'down',  // 'j',
  75: 'up',    // 'k',
  76: 'right', // 'l',

  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
}

class Store extends EventEmitter {
  constructor(bridge) {
    super()
    this.data = new Map();
    this.roots = new List();
    this.parents = new window.Map();
    this.bridge = bridge;
    this.hovered = null;
    this.selected = null;
    this.selBottom = false;
    this.bridge.on('root', id => {
      this.roots = this.roots.push(id);
      if (!this.selected) {
        this.selected = id;
        this.emit('selected');
      }
      this.emit('roots');
    });
    window.store = this;

    this.bridge.on('mount', (data) => {
      var map = Map(data).set('renders', 1);
      if (data.nodeType === 'Custom') {
        map = map.set('collapsed', true);
      }
      this.data = this.data.set(data.id, map);
      if (data.children && data.children.forEach) {
        data.children.forEach(cid => {
          this.parents.set(cid, data.id);
        });
      }
      this.emit(data.id);
    });

    this.bridge.on('select', id => {
      var node = this.get(id);
      var pid = this.parents.get(id);
      while (pid) {
        node = this.get(pid);
        if (node.get('collapsed')) {
          this.toggleCollapse(pid);
        }
        pid = this.parents.get(pid);
      }
      this.selectTop(this.skipWrapper(id));
    });

    this.bridge.on('update', (data) => {
      var node = this.get(data.id)
      if (!node) {
        return;
      }
      data.renders = node.get('renders') + 1;
      this.data = this.data.mergeIn([data.id], Map(data));
      if (data.children && data.children.forEach) {
        data.children.forEach(cid => {
          this.parents.set(cid, data.id);
        });
      }
      this.emit(data.id);
    });

    this.bridge.on('unmount', id => {
      var pid = this.parents.get(id);
      this.parents.delete(id);
      this.data = this.data.delete(id)
      if (pid) {
        this.emit(pid);
      } else {
        this.roots = this.roots.delete(this.roots.indexOf(id));
        this.emit('roots');
      }
    });
  }

  onKeyDown(e) {
    if (window.document.activeElement !== document.body) {
      return;
    }
    if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }
    var dir = keyCodes[e.keyCode];
    if (!dir) {
      return;
    }
    e.preventDefault();
    var dest = this.getDest(dir);
    if (!dest) {
      return;
    }
    var move = this.getMove(dest);
    if (move && move !== this.selected) {
      this.select(move);
    }
  }

  skipWrapper(id, up) {
    if (!id) {
      return;
    }
    var node = this.get(id);
    if (node.get('nodeType') !== 'Wrapper') {
      return id;
    }
    if (up) {
      return this.parents.get(id);
    }
    return node.get('children')[0];
  }

  hasBottom(id) {
    var node = this.get(id);
    var children = node.get('children');
    if ('string' === typeof children || !children || !children.length || node.get('collapsed')) {
      return false;
    }
    return true;
  }

  getDest(dir) {
    var id = this.selected;
    var bottom = this.selBottom;
    var node = this.get(id);
    var collapsed = node.get('collapsed');
    var children = node.get('children');
    var hasChildren = children && 'string' !== typeof children && children.length;
    var pid = this.parents.get(id);

    return dirToDest(dir, bottom, collapsed, hasChildren);
  }

  getMove(dest) {
    var id = this.selected;
    var bottom = this.selBottom;
    var node = this.get(id);
    var pid = this.skipWrapper(this.parents.get(id), true);

    if (dest === 'parent') {
      return pid;
    }
    if (dest === 'parentBottom') {
      this.selBottom = true;
      return pid;
    }

    if (dest === 'collapse') {
      this.toggleCollapse(id);
      return;
    }
    if (dest === 'uncollapse') {
      this.toggleCollapse(id);
      return;
    }

    if (dest === 'bottom') {
      this.selBottom = true;
      this.emit(this.selected);
      return;
    }
    if (dest === 'top') {
      this.selBottom = false;
      this.emit(this.selected);
      return;
    }

    if (dest === 'firstChild') {
      var children = node.get('children')
      if ('string' === typeof children) {
        return this.getMove('nextSibling');
      }
      this.selBottom = false;
      return this.skipWrapper(children[0]);
    }
    if (dest === 'lastChild') {
      var children = node.get('children');
      if ('string' === typeof children) {
        return this.getMove('prevSibling');
      }
      var cid = this.skipWrapper(children[children.length - 1]);
      if (!this.hasBottom(cid)) {
        this.selBottom = false;
      }
      return cid;
    }

    if (!pid) {
      var ix = this.roots.indexOf(id);
      if (ix === -1) {
        ix = this.roots.indexOf(this.parents.get(id));
      }
      if (dest === 'prevSibling') { // prev root
        if (ix === 0) {
          return null;
        }
        var prev = this.skipWrapper(this.roots.get(ix - 1));
        this.selBottom = this.hasBottom(prev);
        return prev;
      } else if (dest === 'nextSibling') {
        if (ix >= this.roots.size - 1) {
          return null;
        }
        this.selBottom = false;
        return this.skipWrapper(this.roots.get(ix + 1));
      }
      return null;
    }

    var parent = this.get(pid);
    var pchildren = parent.get('children');
    var pix = pchildren.indexOf(id);
    if (pix === -1) {
      pix = pchildren.indexOf(this.parents.get(id));
    }
    if (dest === 'prevSibling') {
      if (pix === 0) {
        return this.getMove('parent');
      }
      var cid = this.skipWrapper(pchildren[pix - 1]);
      if (this.hasBottom(cid)) {
        this.selBottom = true;
      }
      return cid;
    }
    if (dest === 'nextSibling') {
      if (pix === pchildren.length - 1) {
        return this.getMove('parentBottom');
      }
      this.selBottom = false;
      return this.skipWrapper(pchildren[pix + 1]);
    }
    return null;
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

  setProps(id, path, value) {
    this.bridge.send('setProps', {id, path, value});
  }

  setState(id, path, value) {
    this.bridge.send('setState', {id, path, value});
  }

  setContext(id, path, value) {
    this.bridge.send('setContext', {id, path, value});
  }

  inspect(id, path, cb) {
    this.bridge.inspect(id, path, cb)
  }

  makeGlobal(id, path) {
    this.bridge.send('makeGlobal', {id, path});
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
      this.bridge.send('highlight', id);
    } else if (this.hovered === id) {
      this.hovered = null;
      this.emit(id);
      this.emit('hover');
      this.bridge.send('hideHighlight');
    }
  }

  selectBottom(id) {
    this.selBottom = true;
    this.select(id);
  }

  selectTop(id) {
    this.selBottom = false;
    this.select(id);
  }

  select(id) {
    var oldSel = this.selected;
    this.selected = id;
    if (oldSel) {
      this.emit(oldSel);
    }
    this.emit(id);
    this.emit('selected');
    window.$selid = id;
    window.$sel = this.get(id);
    this.bridge.send('selected', id);
    this.bridge.send('highlight', id);
  }

  addRoot(id) {
    this.roots = this.roots.push(id);
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
