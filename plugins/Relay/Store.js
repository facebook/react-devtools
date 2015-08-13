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
var {OrderedMap, Map} = require('immutable');
var assign = require('object-assign');
var consts = require('../../agent/consts');

class Store extends EventEmitter {
  queries: OrderedMap;

  constructor(bridge: Bridge, mainStore: Object) {
    super();
    this.selectedQuery = null;
    this.queries = new OrderedMap();
    this._bridge = bridge;
    this._mainStore = store;
    bridge.on('relay:pending', data => {
      this.queries = this.queries.set(data.id, new Map(data).set('status', 'pending'));
      this.emit('queries');
      this.emit(data.id);
    });
    bridge.on('relay:success', ({id, response, end}) => {
      console.log('response', id, response);
      this.queries = this.queries.mergeIn([id], new Map({status: 'success', response, end}));
      this.emit('queries');
      this.emit(id);
    });
    bridge.on('relay:failure', ({id, error, end}) => {
      console.log('error', id, error);
      this.queries = this.queries.mergeIn([id], new Map({status: 'failure', error, end}));
      this.emit('queries');
      this.emit(id);
    });
  }

  inspect(id: string, path: Array<string>, cb: () => void) {
    this._bridge.inspect(id, path, value => {
      var base = this.queries.get(id).get(path[0]);
      var inspected = path.slice(1).reduce((obj, attr) => obj ? obj[attr] : null, base);
      if (inspected) {
        assign(inspected, value);
        inspected[consts.inspected] = true;
      }
      cb();
    });
  }

  off(evt: string, fn: () => void) {
    this.removeListener(evt, fn);
  }

  selectQuery(id: string) {
    this.selectedQuery = id;
    this.emit('selectedQuery');
  }
}

module.exports = Store;
