
import EventEmitter from 'events'
import {Map, Set} from 'immutable'

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
    this.roots = new Set();
    this.parents = new window.Map();
    this.bridge = bridge;
    this.hovered = null;
    this.selected = null;
    this.selBottom = false;
    this.bridge.on('root', id => {
      console.log('got rot');
      this.roots = this.roots.add(id);
      if (!this.selected) {
        this.selected = id;
        this.emit('selected');
      }
      this.emit('roots');
    });

    this.bridge.on('mount', (data) => {
      this.data = this.data.set(data.id, Map(data));
      if (data.children && data.children.forEach) {
        data.children.forEach(cid => {
          this.parents.set(cid, data.id);
        });
      }
      this.emit(data.id);
    });

    this.bridge.on('update', (data) => {
      this.data = this.data.set(data.id, Map(data));
      if (data.children && data.children.forEach) {
        data.children.forEach(cid => {
          this.parents.set(cid, data.id);
        });
      }
      this.emit(data.id);
    });

    this.bridge.on('unmount', id => {
      this.parents.delete(id);
      // this.data = this.data.set(data.id, Map(data));
      // this.emit(data.id);
    });
  }

  onKeyDown(e) {
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
    var hasChildren = children && children.length;
    var pid = this.parents.get(id);
    if (dir === 'down') {
      if (bottom || collapsed || !hasChildren) {
        return 'nextSibling';
      }
      return 'firstChild';
    }

    if (dir === 'up') {
      if (!bottom || collapsed || !hasChildren) {
        return 'prevSibling';
      }
      return 'lastChild';
    }

    if (dir === 'left') {
      if (!collapsed && hasChildren) {
        if (bottom) {
          return 'top';
        }
        return 'collapse';
      }
      return 'parent';
    }

    if (dir === 'right') {
      if (collapsed && hasChildren) {
        return 'uncollapse';
      }
      if (hasChildren) {
        return 'firstChild';
      }
      return null;
    }
  }

  getMove(dest) {
    console.log('move', dest)
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

  setState(id, path, value) {
    this.bridge.send('setState', {id, path, value});
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
