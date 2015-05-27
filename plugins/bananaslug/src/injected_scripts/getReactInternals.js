/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
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
      if (!wait) {
        return;
      }
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
