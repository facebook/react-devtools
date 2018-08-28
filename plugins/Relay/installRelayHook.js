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
 * Also do not declare any variables in top level scope!
 */

function installRelayHook(window: Object) {
  var performance = window.performance;
  var performanceNow;
  if (performance && typeof performance.now === 'function') {
    performanceNow = () => performance.now();
  } else {
    performanceNow = () => Date.now();
  }

  const TEXT_CHUNK_LENGTH = 500;

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

  function recordRequest(
    type: 'mutation' | 'query',
    start: number,
    request,
    requestNumber: number,
  ) {
    var id = Math.random().toString(16).substr(2);
    request.getPromise().then(
      response => {
        emit('relay:success', {
          id: id,
          end: performanceNow(),
          response: response.response,
        });
      },
      error => {
        emit('relay:failure', {
          id: id,
          end: performanceNow(),
          error: error,
        });
      },
    );
    const textChunks = [];
    let text = request.getQueryString();
    while (text.length > 0) {
      textChunks.push(text.substr(0, TEXT_CHUNK_LENGTH));
      text = text.substr(TEXT_CHUNK_LENGTH);
    }
    return {
      id: id,
      name: request.getDebugName(),
      requestNumber: requestNumber,
      start: start,
      text: textChunks,
      type: type,
      variables: request.getVariables(),
    };
  }

  let requestNumber = 0;

  function instrumentRelayRequests(relayInternals: Object) {
    var NetworkLayer = relayInternals.NetworkLayer;

    decorate(NetworkLayer, 'sendMutation', mutation => {
      requestNumber++;
      emit(
        'relay:pending',
        [recordRequest('mutation', performanceNow(), mutation, requestNumber)]
      );
    });

    decorate(NetworkLayer, 'sendQueries', queries => {
      requestNumber++;
      const start = performanceNow();
      emit(
        'relay:pending',
        queries.map(query => recordRequest('query', start, query, requestNumber))
      );
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
    configurable: true,
    set: function(relayInternals) {
      _relayInternals = instrumentRelayRequests(relayInternals);
    },
    get: function() {
      return _relayInternals;
    },
  }: any));
}

module.exports = installRelayHook;
