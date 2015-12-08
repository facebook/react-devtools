/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const BananaSlugAbstractNodeMeasurer = require('./BananaSlugAbstractNodeMeasurer');
const BananaSlugUtils = require('./BananaSlugUtils');
const BananaSlugWebNodeMeasurer = require('./BananaSlugWebNodeMeasurer');
const Map = require('fbjs/lib/Map');
const ReactDOM = require('react-dom');

const NODE_TYPE_COMPOSITE = 'Composite';
const {canUseWebDOM} = BananaSlugUtils;

class BananaSlugObserver {
  static observe(agent: Agent) {
    return new BananaSlugObserver(agent);
  }

  constructor(agent: Agent) {
    this._onMeasureNode = this._onMeasureNode.bind(this);

    this._measurer = canUseWebDOM() ?
      new BananaSlugWebNodeMeasurer() :
      new BananaSlugAbstractNodeMeasurer();

    this._subscriptions = [
      agent.on('mount', this._onMount.bind(this, agent)),
      agent.on('update', this._onUpdate.bind(this, agent)),
      agent.on('unmount', this._onUnmount.bind(this, agent)),
    ];

    this._nodes = new Map();
  }

  _onMount(agent: Agent, obj: any) {
    // pass
  }

  _onUpdate(agent: Agent, obj: any) {
    if (
      !obj.publicInstance ||
      !obj.id ||
      obj.nodeType !== NODE_TYPE_COMPOSITE
    ) {
      return;
    }

    var node = agent.getNodeForID(obj.id);
    if (!node) {
      return;
    }

    this._nodes.set(obj.id, node);
    this._measurer.request(node, this._onMeasureNode);
  }

  _onUnmount(agent: Agent, id: string) {
    if (!this._nodes.has(id)) {
      return;
    }
    var node = this._nodes.get(id);
    this._nodes.delete(id);
  }

  _onMeasureNode(info: Object) {
    console.log(info);
  }
}

module.exports = BananaSlugObserver;
