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
  function detectReactBuildType(renderer) {
    try {
      var toString = Function.prototype.toString;
      if (typeof renderer.version === 'string') {
        // React DOM Fiber (16+)
        if (renderer.bundleType > 0) {
          // This is not a production build.
          // We are currently only using 0 (PROD) and 1 (DEV)
          // but might add 2 (PROFILE) in the future.
          return 'development';
        }
        // The above should cover envification, but we should still make sure
        // that the bundle code has been uglified.
        var findFiberCode = toString.call(renderer.findFiberByHostInstance);
        // Filter out bad results (if that is even possible):
        if (findFiberCode.indexOf('function') !== 0) {
          // Hope for the best if we're not sure.
          return 'production';
        }

        // By now we know that it's envified--but what if it's not minified?
        // This can be bad too, as it means DEV code is still there.

        // FIXME: this is fragile!
        // We should replace this check with check on a specially passed
        // function. This also doesn't detect lack of dead code elimination
        // (although this is not a problem since flat bundles).
        if (findFiberCode.indexOf('getClosestInstanceFromNode') !== -1) {
          return 'unminified';
        }

        // We're good.
        return 'production';
      }
      if (renderer.Mount && renderer.Mount._renderNewRootComponent) {
        // React DOM Stack
        var renderRootCode = toString.call(renderer.Mount._renderNewRootComponent);
        // Filter out bad results (if that is even possible):
        if (renderRootCode.indexOf('function') !== 0) {
          // Hope for the best if we're not sure.
          return 'production';
        }
        // Check for React DOM Stack < 15.1.0 in development.
        // If it contains "storedMeasure" call, it's wrapped in ReactPerf (DEV only).
        // This would be true even if it's minified, as method name still matches.
        if (renderRootCode.indexOf('storedMeasure') !== -1) {
          return 'development';
        }
        // For other versions (and configurations) it's not so easy.
        // Let's quickly exclude proper production builds.
        // If it contains a warning message, it's either a DEV build,
        // or an PROD build without proper dead code elimination.
        if (renderRootCode.indexOf('should be a pure function') !== -1) {
          // Now how do we tell a DEV build from a bad PROD build?
          // If we see NODE_ENV, we're going to assume this is a dev build
          // because most likely it is referring to an empty shim.
          if (renderRootCode.indexOf('NODE_ENV') !== -1) {
            return 'development';
          }
          // If we see "development", we're dealing with an envified DEV build
          // (such as the official React DEV UMD).
          if (renderRootCode.indexOf('development') !== -1) {
            return 'development';
          }
          // I've seen process.env.NODE_ENV !== 'production' being smartly
          // replaced by `true` in DEV by Webpack. I don't know how that
          // works but we can safely guard against it because `true` was
          // never used in the function source since it was written.
          if (renderRootCode.indexOf('true') !== -1) {
            return 'development';
          }
          // By now either it is a production build that has not been minified,
          // or (worse) this is a minified development build using non-standard
          // environment (e.g. "staging"). We're going to look at whether
          // the function argument name is mangled:
          if (
            // 0.13 to 15
            renderRootCode.indexOf('nextElement') !== -1 ||
            // 0.12
            renderRootCode.indexOf('nextComponent') !== -1
          ) {
            // We can't be certain whether this is a development build or not,
            // but it is definitely unminified.
            return 'unminified';
          } else {
            // This is likely a minified development build.
            return 'development';
          }
        }
        // By now we know that it's envified and dead code elimination worked,
        // but what if it's still not minified? (Is this even possible?)
        // Let's check matches for the first argument name.
        if (
          // 0.13 to 15
          renderRootCode.indexOf('nextElement') !== -1 ||
          // 0.12
          renderRootCode.indexOf('nextComponent') !== -1
        ) {
          return 'unminified';
        }
        // Seems like we're using the production version.
        // Now let's check if we're still on 0.14 or lower:
        if (renderRootCode.indexOf('._registerComponent') !== -1) {
          // TODO: we can remove the condition above once 16
          // is older than a year. Since this branch only runs
          // for Stack, we can flip it completely when Stack
          // is old enough. The branch for Fiber is above,
          // and it can check renderer.version directly.
          return 'outdated';
        }
        // We're all good.
        return 'production';
      }
    } catch (err) {
      // Weird environments may exist.
      // This code needs a higher fault tolerance
      // because it runs even with closed DevTools.
      // TODO: should we catch errors in all injected code, and not just this part?
    }
    return 'production';
  }
  function detectRendererName(renderer) {
    if (renderer.rendererPackageName) {
      return renderer.rendererPackageName;
    }
    // Try to detect old versions without id injected
    try {
      var toString = Function.prototype.toString;
      if (typeof renderer.version === 'string') {
        // React DOM Fiber (16+)
        return 'react-dom';
      }
      if (renderer.Mount && renderer.Mount._renderNewRootComponent) {
        // React DOM Stack like renderer
        var renderRootCode = toString.call(
          renderer.Mount._renderNewRootComponent
        );

        // React DOM 15.*
        if (
          renderRootCode.indexOf('ensureScrollValueMonitoring') !== -1 &&
          renderRootCode.indexOf('37') !== -1
        ) {
          return 'react-dom';
        }
        // React DOM Stack 0.13.*/0.14.*
        if (renderRootCode.indexOf('_registerComponent') !== -1) {
          return 'react-dom';
        }
        // Something we're not aware of => not ReactDOM
        return 'unknown';
      }
    } catch (err) {
      // TODO: Mirrors error handling of detectReactBuildType()
    }
    return 'unknown';
  }
  function detectDuplicatedRenderers(renderers) {
    //  Detect if we have more than one ReactDOM instance
    var renderersMap = {};

    Object.keys(renderers).forEach(id => {
      const name = detectRendererName(renderers[id]);

      if (name !== 'unknown') {
        renderersMap[name] = renderersMap[name] ? renderersMap[name] + 1 : 1;
      }
    });
    return Object.keys(renderersMap).map(key => renderersMap[key]).some(rendererCount => rendererCount > 1);
  }
  const hook = ({
    // Shared between Stack and Fiber:
    _renderers: {},
    helpers: {},
    inject: function(renderer) {
      var id = Math.random().toString(16).slice(2);
      hook._renderers[id] = renderer;
      var isReactDuplicated = detectDuplicatedRenderers(hook._renderers);

      // Currently we overwrite buildType with each injected renderer's type
      var reactBuildType = isReactDuplicated
        ? 'duplicated'
        : detectReactBuildType(renderer);

      hook.emit('renderer', {id, renderer, reactBuildType});
      return id;
    },
    _listeners: {},
    sub: function(evt, fn) {
      hook.on(evt, fn);
      return () => hook.off(evt, fn);
    },
    on: function(evt, fn) {
      if (!hook._listeners[evt]) {
        hook._listeners[evt] = [];
      }
      hook._listeners[evt].push(fn);
    },
    off: function(evt, fn) {
      if (!hook._listeners[evt]) {
        return;
      }
      var ix = hook._listeners[evt].indexOf(fn);
      if (ix !== -1) {
        hook._listeners[evt].splice(ix, 1);
      }
      if (!hook._listeners[evt].length) {
        hook._listeners[evt] = null;
      }
    },
    emit: function(evt, data) {
      if (hook._listeners[evt]) {
        hook._listeners[evt].map(fn => fn(data));
      }
    },
    // Fiber-only:
    supportsFiber: true,
    _fiberRoots: {},
    getFiberRoots(rendererID) {
      const roots = hook._fiberRoots;
      if (!roots[rendererID]) {
        roots[rendererID] = new Set();
      }
      return roots[rendererID];
    },
    onCommitFiberUnmount: function(rendererID, fiber) {
      // TODO: can we use hook for roots too?
      if (hook.helpers[rendererID]) {
        hook.helpers[rendererID].handleCommitFiberUnmount(fiber);
      }
    },
    onCommitFiberRoot: function(rendererID, root) {
      const mountedRoots = hook.getFiberRoots(rendererID);
      const current = root.current;
      const isKnownRoot = mountedRoots.has(root);
      const isUnmounting = current.memoizedState == null || current.memoizedState.element == null;
      // Keep track of mounted roots so we can hydrate when DevTools connect.
      if (!isKnownRoot && !isUnmounting) {
        mountedRoots.add(root);
      } else if (isKnownRoot && isUnmounting) {
        mountedRoots.delete(root);
      }
      if (hook.helpers[rendererID]) {
        hook.helpers[rendererID].handleCommitFiberRoot(root);
      }
    },
  });
  Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
    value: (hook : Hook),
  });
}

module.exports = installGlobalHook;
