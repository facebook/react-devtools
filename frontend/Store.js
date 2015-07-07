/** @ xx flow
 *
 * flow disabled because of the following bug:
 * possibly undefined value
 * https://github.com/facebook/flow/issues/603
**/

import {EventEmitter} from 'events';
import {Map, Set, List} from './imm';
import assign from 'object-assign';

import type Bridge from '../backend/Bridge'
import type {DOMNode, DOMEvent, Dir, Dest} from './types'

import dirToDest from './dirToDest';
import nodeMatchesText from './nodeMatchesText';

var keyCodes = {
  '72': 'left',  // 'h',
  '74': 'down',  // 'j',
  '75': 'up',    // 'k',
  '76': 'right', // 'l',

  '37': 'left',
  '38': 'up',
  '39': 'right',
  '40': 'down',
}

type ElementID = string;

type ListenerFunction = () => void;
type DataType = Map;
type ContextMenu = {
  type: string,
  x: number,
  y: number,
  args: Array<any>,
};

class Store extends EventEmitter {
  _bridge: Bridge;
  _nodes: Map;
  _parents: Map;

  contextMenu: ?ContextMenu;
  searchRoots: ?List;
  roots: List;
  hovered: ?ElementID;
  selected: ?ElementID;
  isBottomTagSelected: boolean;
  searchText: string;
  // an object describing the capabilities of the inspected runtime.
  capabilities: {
    scroll?: boolean,
  };

  constructor(bridge: Bridge) {
    super()
    this._nodes = new Map();
    this.roots = new List();
    this._parents = new Map();
    this._bridge = bridge;
    this.hovered = null;
    this.selected = null;
    this.isBottomTagSelected = false;
    this.searchText = '';
    this.capabilities = {};
    this._bridge.on('root', id => {
      if (this.roots.contains(id)) {
        return;
      }
      this.roots = this.roots.push(id);
      if (!this.selected) {
        this.selected = id;
        this.emit('selected');
        this._bridge.send('selected', id);
      }
      this.emit('roots');
    });
    // for debugging
    window.store = this;

    this._bridge.on('select', id => {
      this.revealDeep(id);
      this.selectTop(this.skipWrapper(id));
    });

    this._bridge.on('mount', (data) => this.mountComponent(data));
    this._bridge.on('update', (data) => this.updateComponent(data));
    this._bridge.on('unmount', id => this.unmountComponenent(id));

    this.establishConnection();
  }

  establishConnection() {
    var tries = 0;
    var requestInt;
    var done = false;
    this._bridge.on('capabilities', capabilities => {
      if (done) {
        return;
      }
      this.capabilities = assign(this.capabilities, capabilities);
      this.emit('connected');
      clearInterval(requestInt);
      done = true;
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
    }, 100);
  }

  scrollToNode(id: ElementID): void {
    this._bridge.send('scrollToNode', id);
  }

  onChangeSearch(text: string): void {
    var needle = text.toLowerCase();
    if (needle === this.searchText.toLowerCase()) {
      return;
    }
    if (!text) {
      this.searchRoots = null;
    } else {
      var base;
      if (this.searchRoots && needle.indexOf(this.searchText.toLowerCase()) === 0) {
        this.searchRoots = this.searchRoots
          .filter(item => {
            var node = this.get(item)
            return (node.get('name') && node.get('name').toLowerCase().indexOf(needle) !== -1) ||
              (node.get('text') && node.get('text').toLowerCase().indexOf(needle) !== -1) ||
              ('string' === typeof node.get('children') && node.get('children').toLowerCase().indexOf(needle) !== -1);
          });
      } else {
        this.searchRoots = this._nodes.entrySeq()
          .filter(([key, val]) => nodeMatchesText(val, needle))
          .map(([key, val]) => key)
          .toList();
      }
      // $FlowFixMe
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
        this.revealDeep(this.selected);
      } else {
        this.select(this.roots.get(0));
      }
    }
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

  selectFirstNode() {
    if (this.searchRoots) {
      this.select(this.searchRoots.get(0), true);
    }
  }

  revealDeep(id: ElementID) {
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

  onKeyDown(e: DOMEvent) {
    if (window.document.activeElement !== document.body) {
      return;
    }
    if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

    var direction = keyCodes[e.keyCode];
    if (!direction) {
      return;
    }
    e.preventDefault();
    var dest = this.getDest(direction);
    if (!dest) {
      return;
    }
    var move = this.getNewSelection(dest);
    if (move && move !== this.selected) {
      this.select(move);
    }
  }

  skipWrapper(id: ElementID, up?: boolean): ?ElementID {
    if (!id) {
      return;
    }
    var node = this.get(id);
    if (node.get('nodeType') !== 'Wrapper') {
      return id;
    }
    if (up) {
      return this._parents.get(id);
    }
    return node.get('children')[0];
  }

  hasBottom(id: ElementID): boolean {
    var node = this.get(id);
    var children = node.get('children');
    if ('string' === typeof children || !children || !children.length || node.get('collapsed')) {
      return false;
    }
    return true;
  }

  getDest(dir: Dir): ?Dest {
    var id = this.selected;
    if (!id) {
      return;
    }
    var bottom = this.isBottomTagSelected;
    var node = this.get(id);
    var collapsed = node.get('collapsed');
    var children = node.get('children');
    var hasChildren = children && 'string' !== typeof children && children.length;
    var pid = this._parents.get(id);

    if (this.searchRoots && this.searchRoots.contains(id)) {
      pid = null;
    }

    return dirToDest(dir, bottom, collapsed, hasChildren);
  }

  getNewSelection(dest: Dest): ?ElementID {
    var id = this.selected;
    if (!id) {
      return;
    }
    var bottom = this.isBottomTagSelected;
    var node = this.get(id);
    var pid = this.skipWrapper(this._parents.get(id), true);

    if (this.searchRoots && this.searchRoots.contains(id)) {
      pid = null;
    }

    if (dest === 'parent') {
      return pid;
    }
    if (dest === 'parentBottom') {
      this.isBottomTagSelected = true;
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
      this.isBottomTagSelected = true;
      this.emit(this.selected);
      return;
    }
    if (dest === 'top') {
      this.isBottomTagSelected = false;
      this.emit(this.selected);
      return;
    }

    if (dest === 'firstChild') {
      var children = node.get('children')
      if ('string' === typeof children) {
        return this.getNewSelection('nextSibling');
      }
      this.isBottomTagSelected = false;
      return this.skipWrapper(children[0]);
    }
    if (dest === 'lastChild') {
      var children = node.get('children');
      if ('string' === typeof children) {
        return this.getNewSelection('prevSibling');
      }
      var cid = this.skipWrapper(children[children.length - 1]);
      if (cid && !this.hasBottom(cid)) {
        this.isBottomTagSelected = false;
      }
      return cid;
    }

    if (!pid) {
      var roots = this.searchRoots || this.roots;
      var ix = roots.indexOf(id);
      if (ix === -1) {
        ix = roots.indexOf(this._parents.get(id));
      }
      if (dest === 'prevSibling') { // prev root
        if (ix === 0) {
          return null;
        }
        var prev = this.skipWrapper(roots.get(ix - 1));
        this.isBottomTagSelected = prev ? this.hasBottom(prev) : false; // flowtype requires the ternary
        return prev;
      } else if (dest === 'nextSibling') {
        if (ix >= roots.size - 1) {
          return null;
        }
        this.isBottomTagSelected = false;
        return this.skipWrapper(roots.get(ix + 1));
      }
      return null;
    }

    var parent = this.get(pid);
    var pchildren = parent.get('children');
    var pix = pchildren.indexOf(id);
    if (pix === -1) {
      pix = pchildren.indexOf(this._parents.get(id));
    }
    if (dest === 'prevSibling') {
      if (pix === 0) {
        return this.getNewSelection('parent');
      }
      var cid = this.skipWrapper(pchildren[pix - 1]);
      if (cid && this.hasBottom(cid)) {
        this.isBottomTagSelected = true;
      }
      return cid;
    }
    if (dest === 'nextSibling') {
      if (pix === pchildren.length - 1) {
        return this.getNewSelection('parentBottom');
      }
      this.isBottomTagSelected = false;
      return this.skipWrapper(pchildren[pix + 1]);
    }
    return null;
  }

  get(id: ElementID): DataType {
    return this._nodes.get(id);
  }

  off(evt: DOMEvent, fn: ListenerFunction): void {
    this.removeListener(evt, fn);
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

  inspect(id: ElementID, path: Array<string>, cb: (val: any) => void) {
    this._bridge.inspect(id, path, cb)
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
      this._bridge.send('highlight', id);
    } else if (this.hovered === id) {
      this.hovered = null;
      this.emit(id);
      this.emit('hover');
      this._bridge.send('hideHighlight');
    }
  }

  selectBottom(id: ElementID) {
    this.isBottomTagSelected = true;
    this.select(id);
  }

  selectTop(id: ?ElementID) {
    this.isBottomTagSelected = false;
    this.select(id);
  }

  select(id: ?ElementID, noHighlight?: boolean) {
    var oldSel = this.selected;
    this.selected = id;
    if (oldSel) {
      this.emit(oldSel);
    }
    if (id) {
      this.emit(id);
    }
    this.emit('selected');
    this._bridge.send('selected', id);
    if (!noHighlight) {
      this._bridge.send('highlight', id);
    }
  }

  mountComponent(data: DataType) {
    var map = Map(data).set('renders', 1);
    if (data.nodeType === 'Custom') {
      map = map.set('collapsed', true);
    }
    this._nodes = this._nodes.set(data.id, map);
    if (data.children && data.children.forEach) {
      data.children.forEach(cid => {
        this._parents = this._parents.set(cid, data.id);
      });
    }
    this.emit(data.id);
    if (this.searchRoots && nodeMatchesText(map, this.searchText.toLowerCase())) {
      // $FlowFixMe - flow things this might still be null (but it's not b/c
      // of line 271)
      this.searchRoots = this.searchRoots.push(data.id);
      this.emit('searchRoots');
    }
  }

  updateComponent(data: DataType) {
    var node = this.get(data.id)
    if (!node) {
      return;
    }
    data.renders = node.get('renders') + 1;
    this._nodes = this._nodes.mergeIn([data.id], Map(data));
    if (data.children && data.children.forEach) {
      data.children.forEach(cid => {
        this._parents = this._parents.set(cid, data.id);
      });
    }
    this.emit(data.id);
  }

  unmountComponenent(id: ElementID) {
    var pid = this._parents.get(id);
    this._parents = this._parents.delete(id);
    this._nodes = this._nodes.delete(id)
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
      var newsel = pid || this.roots.get(0);
      this.selectTop(newsel);
    }
    if (this.searchRoots && this.searchRoots.contains(id)) {
      // $FlowFixMe flow things searchRoots might be null
      this.searchRoots = this.searchRoots.delete(this.searchRoots.indexOf(id));
      this.emit('searchRoots');
    }
  }

}

module.exports = Store;
