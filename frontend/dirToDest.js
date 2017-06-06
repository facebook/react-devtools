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

import type {Dir, Dest} from './types';

module.exports = function(dir: Dir, bottom: boolean, collapsed: boolean, hasChildren: boolean): ?Dest {
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
      return bottom ? 'selectTop' : 'collapse';
    }
    return 'parent';
  }

  if (dir === 'right') {
    if (collapsed && hasChildren) {
      return 'uncollapse';
    }
    if (hasChildren) {
      if (bottom) {
        return null;
      } else {
        return 'firstChild';
      }
    }
  }

  return null;
};
