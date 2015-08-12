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

var {EventEmitter} = require('events');
var {Map} = require('immutable');

class Store extends EventEmitter {
  queries: Map;

  constructor(bridge: Bridge) {
    super();
    this.queries = new Map();
    bridge.on('relay:pending', data => {
      this.queries = this.queries.set(data.id, new Map(data).set('status', 'pending'));
      this.emit('queries');
    });
    bridge.on('relay:success', ({id, val}) => {
      console.log('val', id, val);
      this.queries = this.queries.setIn([id, 'status'], 'success');
      this.emit('queries');
    });
    bridge.on('relay:failure', ({id, err}) => {
      console.log('err', id, err);
      this.queries = this.queries.setIn([id, 'status'], 'failure');
      this.emit('queries');
    });
  }

  off(evt: string, fn: () => void) {
    this.removeListener(evt, fn);
  }
}

module.exports = Store;
