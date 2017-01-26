/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

import type {Hook} from './types';

/**
 * NOTE: This file cannot `require` any other modules. We `.toString()` the
 *       function in some places and inject the source into the page.
 */
function installGlobalHook(window: Object) {
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    return;
  }
  Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
    value: ({
      // Shared between Stack and Fiber:
      _renderers: {},
      helpers: {},
      inject: function(renderer) {
        if (typeof renderer.version === 'number' && renderer.version > 1) {
          // This Fiber version is too new and not supported yet.
          // The version field is declared in ReactFiberDevToolsHook.
          // Only Fiber releases have the version field.
          return null;
        }
        var id = Math.random().toString(16).slice(2);
        this._renderers[id] = renderer;
        this.emit('renderer', {id, renderer});
        return id;
      },
      _listeners: {},
      sub: function(evt, fn) {
        this.on(evt, fn);
        return () => this.off(evt, fn);
      },
      on: function(evt, fn) {
        if (!this._listeners[evt]) {
          this._listeners[evt] = [];
        }
        this._listeners[evt].push(fn);
      },
      off: function(evt, fn) {
        if (!this._listeners[evt]) {
          return;
        }
        var ix = this._listeners[evt].indexOf(fn);
        if (ix !== -1) {
          this._listeners[evt].splice(ix, 1);
        }
        if (!this._listeners[evt].length) {
          this._listeners[evt] = null;
        }
      },
      emit: function(evt, data) {
        if (this._listeners[evt]) {
          this._listeners[evt].map(fn => fn(data));
        }
      },
      // Fiber-only:
      supportsFiber: true,
      _fiberRoots: {},
      getFiberRoots(rendererID) {
        return this._fiberRoots[rendererID] || (this._fiberRoots[rendererID] = new Set());
      },
      onCommitFiberUnmount: function(rendererID, fiber) {
        // TODO: can we use this for roots too?
        if (this.helpers[rendererID]) {
          this.helpers[rendererID].handleCommitFiberUnmount(fiber);
        }
      },
      onCommitFiberRoot: function(rendererID, root) {
        const mountedRoots = this.getFiberRoots(rendererID);
        const current = root.current;
        const isKnownRoot = mountedRoots.has(root);
        const isUnmounting = current.memoizedState == null || current.memoizedState.element == null;
        // Keep track of mounted roots so we can hydrate when DevTools connect.
        if (!isKnownRoot && !isUnmounting) {
          mountedRoots.add(root);
        } else if (isKnownRoot && isUnmounting) {
          mountedRoots.delete(root);
        }
        if (this.helpers[rendererID]) {
          this.helpers[rendererID].handleCommitFiberRoot(root);
        }
      },
    }: Hook),
  });
}

module.exports = installGlobalHook;
