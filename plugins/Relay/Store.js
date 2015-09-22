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

function getDataIDs(obj, collector) {
  for (var name in obj) {
    if (name === 'id' && 'string' === typeof obj[name]) {
      collector.push(obj[name]);
    } else if (typeof obj[name] == 'object') {
      getDataIDs(obj[name], collector);
    }
  }
}

class Store extends EventEmitter {
  queries: OrderedMap;
  storeData: Object;

  constructor(bridge: Bridge, mainStore: Object) {
    super();
    this.storeData = null;
    this.selectedQuery = null;
    this.queries = new OrderedMap();
    this._bridge = bridge;
    this._mainStore = store;
    // initial population of the store
    bridge.on('relay:store', data => {
      this.storeData = data;
      this.emit('storeData');
    });
    this.queriesByDataID = {};
    // queries and mutations
    bridge.on('relay:pending', data => {
      this.queries = this.queries.set(data.id, new Map(data).set('status', 'pending'));
      this.emit('queries');
      this.emit(data.id);
      var dataIDs = [];
      getDataIDs(data.variables, dataIDs);
      dataIDs.forEach(id => {
        if (!this.queriesByDataID[id]) {
          this.queriesByDataID[id] = [data.id];
        } else {
          this.queriesByDataID[id].push(data.id);
        }
      });
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
    this.dataIDsToNodes = {};
    this.nodesToDataIDs = {};
    // track nodes
    bridge.on('mount', data => {
      if (!data.props || (!data.props.relay && data.name.indexOf('Relay(') !== 0)) {
        return; // not a relay child
      }
      this.nodesToDataIDs[data.id] = new window.Set();
      for (var name in data.props) {
        var id = data.props[name].__dataID__;
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
        var id = data.props[name].__dataID__;
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

  jumpToDataID(dataID) {
    this._mainStore.setSelectedTab('RelayStore');
    this.selectedDataNode = dataID;
    this.emit('selectedDataNode');
  }

  jumpToQuery(queryID) {
    this._mainStore.setSelectedTab('Relay');
    this.selectedQuery = queryID;
    this.emit('selectedQuery');
    this.emit('queries');
  }

  inspect(id: string, path: Array<string>, cb: () => void) {
    this._bridge.inspect(id, path, value => {
      var base;
      if (id === 'relay:store') {
        base = this.storeData.nodes;
      } else {
        base = this.queries.get(id).get(path[0]);
      }
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
