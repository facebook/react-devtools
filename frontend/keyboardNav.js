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

function getRootSelection(dest, store, id) {
  var roots = store.searchRoots || store.roots;
  var ix = roots.indexOf(id);
  if (ix === -1) {
    ix = roots.indexOf(store._parents.get(id));
  }
  if (dest === 'prevSibling') {
    // prev root
    if (ix === 0) {
      return null;
    }
    var prev = store.skipWrapper(roots.get(ix - 1), false, true);
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

function getNewSelection(dest: Dest, store: Store): ?ElementID {
  var id = store.selected;
  if (!id) {
    return undefined;
  }
  var node = store.get(id);
  var pid = store.getParent(id);

  if (pid) {
    var lastId = id;
    if (dest === 'parent') {
      let parentNode = store.get(pid);
      if (parentNode.get('nodeType') !== 'Wrapper') {
        return pid;
      }
      while (parentNode.get('nodeType') === 'Wrapper') {
        lastId = id;
        id = pid;
        pid = store.getParent(id);
        // we keep traversing up each parent until we have
        // a non wrapper. if we find an empty parent, that means
        // we've hit the top of the tree, meaning we need to
        // use the root as the pid (so we get the roots)
        if (!pid) {
          pid = id;
          id = lastId;
          break;
        }
        parentNode = store.get(pid);
      }
      dest = 'prevSibling';
    } else if (dest === 'parentBottom') {
      let parentNode = store.get(pid);
      if (parentNode.get('nodeType') !== 'Wrapper') {
        store.isBottomTagSelected = true;
        return pid;
      }
      while (parentNode.get('nodeType') === 'Wrapper') {
        lastId = id;
        id = pid;
        pid = store.getParent(id);
        // we keep traversing up each parent until we have
        // a non wrapper. if we find an empty parent, that means
        // we've hit the top of the tree, meaning we need to
        // use the root as the pid (so we get the roots)        
        if (!pid) {
          pid = id;
          id = lastId;
          break;
        }
        parentNode = store.get(pid);
      }
      dest = 'nextSibling';
    }
  }
  if (!id) {
    return undefined;
  }
  // if the parent is a root node, we should set pid to null
  // so we go through the getRootSelection() route below
  if (store.searchRoots && store.searchRoots.contains(pid)) {
    pid = null;
  }
  if (dest === 'collapse' || dest === 'uncollapse') {
    if (dest === 'collapse') {
      store.isBottomTagSelected = false;
    }
    store.toggleCollapse(id);
    return undefined;
  }

  if (dest === 'selectTop') {
    store.selectTop(id);
  }

  var children = node.get('children');
  if (node.get('nodeType') === 'NativeWrapper') {
    children = store.get(children[0]).get('children');
  }

  // Children
  var cid;
  if (dest === 'firstChild') {
    if (typeof children === 'string') {
      return getNewSelection('nextSibling', store);
    }
    for (var i = 0; i < children.length; i++) {
      cid = store.skipWrapper(children[i]);
      if (cid) {
        store.isBottomTagSelected = false;
        return cid;
      }
    }
  }
  if (dest === 'lastChild') {
    if (typeof children === 'string') {
      return getNewSelection('prevSibling', store);
    }
    cid = store.skipWrapper(children[children.length - 1], false, true);
    if (cid && !store.hasBottom(cid)) {
      store.isBottomTagSelected = false;
    }
    return cid;
  }

  // Siblings at the root node
  if (!pid) {
    return getRootSelection(dest, store, id);
  }

  // Siblings
  var parent = store.get(store.getParent(id));
  var pchildren = parent.get('children');
  var pix = pchildren.indexOf(id);
  if (pix === -1) {
    pix = pchildren.indexOf(store._parents.get(id));
  }
  if (dest === 'prevSibling') {
    while (pix > 0) {
      const childId = pchildren[pix - 1];
      const child = store.get(childId);
      const prevCid = store.skipWrapper(
        childId,
        false,
        child.get('nodeType') === 'Wrapper'
      );
      if (prevCid) {
        if (store.hasBottom(prevCid)) {
          store.isBottomTagSelected = true;
        }
        return prevCid;
      }
      pix--;
    }
    const roots = store.searchRoots || store.roots;
    // if the the previous sibling is a root, we need
    // to go the getRootSelection() route to select it
    if (roots.indexOf(store.getParent(id)) > -1) {
      return getRootSelection(dest, store, id);
    }
    const childId = pchildren[pix];
    const child = store.get(childId);
    if (child.get('nodeType') === 'Wrapper') {
      return store.getParent(id);
    }
    return getNewSelection('parent', store);
  }
  if (dest === 'nextSibling') {
    // check if we're at the end of the children array
    if (pix === pchildren.length - 1) {
      const roots = store.searchRoots || store.roots;
      // if the the next sibling is a root, we need
      // to go the getRootSelection() route to select it
      if (roots.indexOf(store.getParent(id)) > -1) {
        return getRootSelection(dest, store, id);
      }
      const childId = pchildren[pix];
      const child = store.get(childId);
      if (child.get('nodeType') === 'Wrapper') {
        store.isBottomTagSelected = true;
        return store.getParent(id);
      }
      return getNewSelection('parentBottom', store);
    }
    store.isBottomTagSelected = false;
    return store.skipWrapper(pchildren[pix + 1]);
  }

  return null;
}
