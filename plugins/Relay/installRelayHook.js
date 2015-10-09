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

/**
 * NOTE: This file cannot `require` any other modules. We `.toString()` the
 *       function in some places and inject the source into the page.
 */
function installRelayHook(window: Object) {
  var hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) {
    return;
  }

  function decorate(obj, attr, fn) {
    var old = obj[attr];
    obj[attr] = function() {
      var res = old.apply(this, arguments);
      fn.apply(this, arguments);
      return res;
    };
  }

  var _eventQueue = [];
  var _listener = null;
  function emit(name: string, data: mixed) {
    _eventQueue.push({name, data});
    if (_listener) {
      _listener(name, data);
    }
  }

  function setRequestListener(
    listener: (name: string, data: mixed) => void
  ): () => void {
    if (_listener) {
      throw new Error(
        'Relay Devtools: Called only call setRequestListener once.'
      );
    }
    _listener = listener;
    _eventQueue.forEach(({name, data}) => {
      listener(name, data);
    });

    return () => {
      _listener = null;
    };
  }

  function recordRequest(type: 'mutation' | 'query', request) {
    var id = Math.random().toString(16).substr(2);
    request.then(
      response => {
        emit('relay:success', {
          id: id,
          end: performance.now(),
          response: response.response,
        });
      },
      error => {
        emit('relay:failure', {
          id: id,
          end: performance.now(),
          error: error,
        });
      },
    );
    return {
      id: id,
      name: request.getDebugName(),
      start: performance.now(),
      text: request.getQueryString(),
      type: type,
      variables: request.getVariables(),
    };
  }

  function instrumentRelayRequests(relayInternals: Object) {
    var NetworkLayer = relayInternals.NetworkLayer;

    decorate(NetworkLayer, 'sendMutation', mutation => {
      emit('relay:pending', [recordRequest('mutation', mutation)]);
    });

    decorate(NetworkLayer, 'sendQueries', queries => {
      emit('relay:pending', queries.map(query => recordRequest('query', query)));
    });

    var instrumented = {};
    for (var key in relayInternals) {
      if (relayInternals.hasOwnProperty(key)) {
        instrumented[key] = relayInternals[key];
      }
    }
    instrumented.setRequestListener = setRequestListener;
    return instrumented;
  }

  var _relayInternals = null;
  Object.defineProperty(hook, '_relayInternals', ({
    set: function(relayInternals) {
      _relayInternals = instrumentRelayRequests(relayInternals);
    },
    get: function() {
      return _relayInternals;
    },
  }: any));
}

module.exports = installRelayHook;
