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

  bridge.send('relay:store', {id: 'relay:store', nodes: DefaultStoreData.getNodeData()});
  var removeListener = setRequestListener((event, data) => {
    bridge.send(event, data);
  });
  hook.on('shutdown', removeListener);
};
