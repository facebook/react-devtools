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
  return () => {
    obj[attr] = old;
  };
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
  var {
    DefaultStoreData,
    setRequestListener,
  } = hook._relayInternals;

  function sendStoreData() {
    bridge.send('relay:store', {
      id: 'relay:store',
      nodes: DefaultStoreData.getNodeData(),
    });
  }

  sendStoreData();
  decorate(DefaultStoreData, 'handleUpdatePayload', sendStoreData);
  decorate(DefaultStoreData, 'handleQueryPayload', sendStoreData);

  var removeListener = setRequestListener((event, data) => {
    bridge.send(event, data);
  });
  hook.on('shutdown', removeListener);
};
