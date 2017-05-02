/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * A helper method for the store, to deal with navigating the tree.
 *
 * @flow
 */
'use strict';

var dirToDest = require('./dirToDest');
import type Store from './Store';
import type {DOMEvent, Dir, Dest, ElementID} from './types';

var keyCodes = {
  '72': 'left',  // 'h',
  '74': 'down',  // 'j',
  '75': 'up',    // 'k',
  '76': 'right', // 'l',

  '37': 'left',
  '38': 'up',
  '39': 'right',
  '40': 'down',
};

module.exports = function keyboardNav(store: Store, win: Object): (e: DOMEvent) => void {
  win = win || window;
  return function(e: DOMEvent) {
    if (win.document.activeElement !== win.document.body) {
      return;
    }
    if (e.shiftKey || e.metaKey) {
      return;
    }

    var direction = keyCodes[e.keyCode];
    if (!direction) {
      return;
    }
    e.preventDefault();
    if (e.altKey && direction === 'right') {
      store.toggleAllChildrenNodes(false);
      return;
    }
    if (e.altKey && direction === 'left') {
      store.toggleAllChildrenNodes(true);
      return;
    }
    if (e.ctrlKey || e.altKey) {
      return;
    }
    var dest = getDest(direction, store);
    if (!dest) {
      return;
    }
    var move = getNewSelection(dest, store);
    if (move && move !== store.selected) {
      store.select(move);
    }
  };
};

function getDest(dir: Dir, store: Store): ?Dest {
  var id = store.selected;
  if (!id) {
    return null;
  }
  var bottom = store.isBottomTagSelected;
  var node = store.get(id);
  var collapsed = node.get('collapsed');
  var children = node.get('children');
  if (node.get('nodeType') === 'NativeWrapper') {
    children = store.get(children[0]).get('children');
  }
  var hasChildren = children && typeof children !== 'string' && children.length;

  return dirToDest(dir, bottom, collapsed, hasChildren);
}

function getNewSelection(dest: Dest, store: Store): ?ElementID {
  var id = store.selected;
  if (!id) {
    return undefined;
  }
  var node = store.get(id);
  var pid = store.skipWrapper(store.getParent(id), true);

  if (store.searchRoots && store.searchRoots.contains(id)) {
    pid = null;
  }

  if (dest === 'parent') {
    return pid;
  }
  if (dest === 'parentBottom') {
    store.isBottomTagSelected = true;
    return pid;
  }

  if (dest === 'collapse' || dest === 'uncollapse') {
    if (dest === 'collapse') {
      store.isBottomTagSelected = false;
    }
    store.toggleCollapse(id);
    return undefined;
  }

  var children = node.get('children');
  if (node.get('nodeType') === 'NativeWrapper') {
    children = store.get(children[0]).get('children');
  }

  // Children
  if (dest === 'firstChild') {
    if (typeof children === 'string') {
      return getNewSelection('nextSibling', store);
    }
    store.isBottomTagSelected = false;
    return store.skipWrapper(children[0]);
  }
  if (dest === 'lastChild') {
    if (typeof children === 'string') {
      return getNewSelection('prevSibling', store);
    }
    var cid = store.skipWrapper(children[children.length - 1]);
    if (cid && !store.hasBottom(cid)) {
      store.isBottomTagSelected = false;
    }
    return cid;
  }

  // Siblings at the root node
  if (!pid) {
    var roots = store.searchRoots || store.roots;
    var ix = roots.indexOf(id);
    if (ix === -1) {
      ix = roots.indexOf(store._parents.get(id));
    }
    if (dest === 'prevSibling') { // prev root
      if (ix === 0) {
        return null;
      }
      var prev = store.skipWrapper(roots.get(ix - 1));
      store.isBottomTagSelected = prev ? store.hasBottom(prev) : false; // flowtype requires the ternary
      return prev;
    } else if (dest === 'nextSibling') {
      if (ix >= roots.size - 1) {
        return null;
      }
      store.isBottomTagSelected = false;
      return store.skipWrapper(roots.get(ix + 1));
    }
    return null;
  }

  // Siblings
  var parent = store.get(store.getParent(id));
  var pchildren = parent.get('children');
  var pix = pchildren.indexOf(id);
  if (pix === -1) {
    pix = pchildren.indexOf(store._parents.get(id));
  }
  if (dest === 'prevSibling') {
    if (pix === 0) {
      return getNewSelection('parent', store);
    }
    var prevCid = store.skipWrapper(pchildren[pix - 1]);
    if (prevCid && store.hasBottom(prevCid)) {
      store.isBottomTagSelected = true;
    }
    return prevCid;
  }
  if (dest === 'nextSibling') {
    if (pix === pchildren.length - 1) {
      return getNewSelection('parentBottom', store);
    }
    store.isBottomTagSelected = false;
    return store.skipWrapper(pchildren[pix + 1]);
  }
  return null;
}
