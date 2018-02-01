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
var invariant = require('../../frontend/invariant');

function getDataIDs(obj): Array<string> {
  var collector = [];
  getDataIDsInternal(obj, collector);
  return collector;
}
function getDataIDsInternal(obj, collector) {
  for (var name in obj) {
    if (name === 'id' && typeof obj[name] === 'string') {
      collector.push(obj[name]);
    } else if (typeof obj[name] === 'object') {
      getDataIDs(obj[name]);
    }
  }
}

class Store extends EventEmitter {
  queries: OrderedMap;
  storeData: ?{
    nodes: any,
  };
  storeDateSubscriptionCount: number;
  dataIDsToNodes: Map;
  selectedDataNode: string;
  nodesToDataIDs: Map;
  _bridge: Bridge;
  _mainStore: Object;
  queriesByDataID: {[id: string]: Array<string>};
  selectedQuery: ?string;

  constructor(bridge: Bridge, mainStore: Object) {
    super();
    this.storeData = null;
    this.storeDateSubscriptionCount = 0;
    this.selectedQuery = null;
    this.queries = new OrderedMap();
    this._bridge = bridge;
    this._mainStore = mainStore;
    // initial population of the store
    bridge.on('relay:store', data => {
      this.storeData = data;
      this.emit('storeData');
    });
    this.queriesByDataID = {};
    // queries and mutations
    bridge.on('relay:pending', pendingQueries => {
      pendingQueries.forEach(pendingQuery => {
        this.queries = this.queries.set(
          pendingQuery.id,
          new Map({
            ...pendingQuery,
            status: 'pending',
            text: pendingQuery.text.join(''),
          })
        );
        this.emit('queries');
        this.emit(pendingQuery.id);
        getDataIDs(pendingQuery.variables).forEach(id => {
          if (!this.queriesByDataID[id]) {
            this.queriesByDataID[id] = [pendingQuery.id];
          } else {
            this.queriesByDataID[id].push(pendingQuery.id);
          }
        });
      });
    });
    bridge.on('relay:success', ({id, response, end}) => {
      this.queries = this.queries.mergeIn([id], new Map({status: 'success', response, end}));
      this.emit('queries');
      this.emit(id);
    });
    bridge.on('relay:failure', ({id, error, end}) => {
      this.queries = this.queries.mergeIn([id], new Map({status: 'failure', error, end}));
      this.emit('queries');
      this.emit(id);
    });
    this.dataIDsToNodes = {};
    this.nodesToDataIDs = {};
    // track nodes
    bridge.on('mount', data => {
      if (!data.props || (!data.props.relay && data.name.indexOf('Relay(') !== 0)) {
        return; // not a relay child
      }
      this.nodesToDataIDs[data.id] = new window.Set();
      for (var name in data.props) {
        var id = data.props[name] && data.props[name].__dataID__;
        if (!id) {
          continue;
        }
        if (!this.dataIDsToNodes[id]) {
          this.dataIDsToNodes[id] = new window.Set();
        }
        this.dataIDsToNodes[id].add(data.id);
        this.nodesToDataIDs[data.id].add(id);
      }
    });
    bridge.on('update', data => {
      if (!data.props || !this.nodesToDataIDs[data.id]) {
        return;
      }
      var newIds = new window.Set();
      for (var name in data.props) {
        var id = data.props[name] && data.props[name].__dataID__;
        if (!id) {
          continue;
        }
        newIds.add(id);
        if (this.nodesToDataIDs[data.id].has(id)) {
          continue;
        }
        if (!this.dataIDsToNodes[id]) {
          this.dataIDsToNodes[id] = new window.Set();
        }
        this.dataIDsToNodes[id].add(data.id);
        // this.nodesToDataIDs[data.id].add(id);
      }

      for (var item of this.nodesToDataIDs[data.id]) {
        if (!newIds.has(item)) {
          this.dataIDsToNodes[item].delete(data.id);
        }
      }
      this.nodesToDataIDs[id] = newIds;
    });
    bridge.on('unmount', id => {
      if (!this.nodesToDataIDs[id]) {
        return;
      }
      for (var item of this.nodesToDataIDs[id]) {
        this.dataIDsToNodes[item].delete(id);
      }
      this.nodesToDataIDs[id] = null;
    });
  }

  jumpToDataID(dataID: string) {
    this._mainStore.setSelectedTab('RelayStore');
    this.selectedDataNode = dataID;
    this.emit('selectedDataNode');
  }

  jumpToQuery(queryID: string) {
    this._mainStore.setSelectedTab('Relay');
    this.selectedQuery = queryID;
    this.emit('selectedQuery');
    this.emit('queries');
  }

  inspect(id: string, path: Array<string>, cb: () => void) {
    this._bridge.inspect(id, path, value => {
      var base;
      if (id === 'relay:store') {
        invariant(
          this.storeData,
          'RelayStore.inspect: this.storeData should be defined.'
        );
        base = this.storeData.nodes;
      } else {
        base = this.queries.get(id).get(path[0]);
      }
      // $FlowFixMe
      var inspected: ?{[string]: boolean} = path.slice(1).reduce((obj, attr) => obj ? obj[attr] : null, base);
      if (inspected) {
        assign(inspected, value);
        inspected[consts.inspected] = true;
      }
      cb();
    });
  }

  on(evt: string, fn: () => void): any {
    if (evt === 'storeData') {
      this.storeDateSubscriptionCount++;
      if (this.storeDateSubscriptionCount === 1) {
        this._bridge.call('relay:store:enable', [], () => {});
      }
    }
    this.addListener(evt, fn);
  }

  off(evt: string, fn: () => void): void {
    if (evt === 'storeData') {
      this.storeDateSubscriptionCount--;
      if (this.storeDateSubscriptionCount === 0) {
        this._bridge.call('relay:store:disable', [], () => {});
      }
    }
    this.removeListener(evt, fn);
  }

  selectQuery(id: string) {
    this.selectedQuery = id;
    this.emit('selectedQuery');
  }
}

module.exports = Store;
