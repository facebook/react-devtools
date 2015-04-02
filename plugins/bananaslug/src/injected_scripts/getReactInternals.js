/**
 * @fileOverview
 * This file is injected into thw native web page.
 */

var WAIT_LIMIT = 60 * 1000;

var {
  window,
} = global;

/**
 * @param {Object}
 * @return {?Object}
 */
function lookupReactInternal(global) {
  if (
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== null &&
    typeof global.__REACT_DEVTOOLS_GLOBAL_HOOK__ === 'object' &&
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__._reactRuntime
  ) {
    return global.__REACT_DEVTOOLS_GLOBAL_HOOK__._reactRuntime;
  }

  if (
    global.React !== null &&
    typeof global.React === 'object' &&
    global.React.__internals
  ) {
    return global.React.__internals;
  }

  if (typeof global.require === 'function') {
    try {
      return global.require('React').__internals;
    } catch (ex) {
      // pass
    }
  }

  if (typeof global.require === 'function') {
    try {
      return global.require('react').__internals;
    } catch (ex) {
      // pass
    }
  }

  return null;
}

/**
 * @return {Object}
 */
function getReactInternals() {
  return new Promise((resolve, reject) => {
    var startTimer = Date.now();

    var wait = () => {
      var result = lookupReactInternal(window);
      if (result) {
        resolve(result);
      } else {
        var now = Date.now();
        if (now - startTimer < WAIT_LIMIT) {
          setTimeout(wait, 500);
          return;
        } else {
          reject();
        }
      }
      wait = null;
      resolve = null;
      reject = null;
    };

    wait();
  });
}

module.exports = getReactInternals;
