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

import type Bridge from '../../agent/Bridge';
import type Agent from '../../agent/Agent';

function decorate(obj, attr, fn) {
  var old = obj[attr];
  obj[attr] = function() {
    var res = old.apply(this, arguments);
    fn.apply(this, arguments);
    return res;
  };
  return () => (obj[attr] = old);
}

function makeId() {
  return Math.random().toString(16);
}

module.exports = (bridge: Bridge, agent: Agent, hook: Object) => {
  var shouldEnable = !!(
    hook._relayInternals &&
    window.location.hash.indexOf('relaydevtools') >= 0
  );

  bridge.onCall('relay:check', () => shouldEnable);
  if (!shouldEnable) {
    return;
  }
  var NetworkLayer = hook._relayInternals.NetworkLayer;

  bridge.send('relay:store', {id: 'relay:store', nodes: hook._relayInternals.DefaultStoreData.getNodeData()});
  var restore = [
    decorate(NetworkLayer, 'sendMutation', mut => {
      var id = makeId();
      var start = Date.now();
      bridge.send('relay:pending', {
        id,
        type: 'mutation',
        start,
        mutation: mut._mutation,
        text: mut.getQueryString(),
        variables: mut.getVariables(),
        name: mut.getDebugName(),
      });
      mut.then(
        response => bridge.send('relay:success', {id, response: response.response, end: Date.now()}),
        error => bridge.send('relay:failure', {id, error, end: Date.now()})
      );
    }),

    decorate(NetworkLayer, 'sendQueries', queries => {
      bridge.send('relay:pending', queries.map(q => {
        var id = makeId();
        q.then(
          response => bridge.send('relay:success', {id, response: response.response, end: Date.now()}),
          error => bridge.send('relay:failure', {id, error, end: Date.now()})
        );
        return {
          id,
          type: 'query',
          start: Date.now(),
          query: q._query,
          text: q.getQueryString(),
          variables: q.getVariables(),
          name: q.getDebugName(),
        };
      }));
    }),
  ];
  hook.on('shutdown', () => {
    restore.forEach(fn => fn());
  });
};
