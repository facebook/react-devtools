/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const BananaSlugAbstractNodeMeasurer = require('./BananaSlugAbstractNodeMeasurer');
const BananaSlugWebNodeMeasurer = require('./BananaSlugWebNodeMeasurer');
const BananaSlugWebNodePresenter = require('./BananaSlugWebNodePresenter');
const BananaSlugAbstractNodePresenter = require('./BananaSlugAbstractNodePresenter');
const Map = require('fbjs/lib/Map');
const ReactDOM = require('react-dom');

const NODE_TYPE_COMPOSITE = 'Composite';

class BananaSlugObserver {
  static observe(agent: Agent) {
    return new BananaSlugObserver(agent);
  }

  constructor(agent: Agent) {
    this._onMeasureNode = this._onMeasureNode.bind(this);

    var useDOM = agent.capabilities.dom;

    this._measurer = useDOM ?
      new BananaSlugWebNodeMeasurer() :
      new BananaSlugAbstractNodeMeasurer();

    this._presenter = useDOM ?
      new BananaSlugWebNodePresenter() :
      new BananaSlugAbstractNodePresenter();

    this._subscriptions = [
      agent.on('mount', this._onMount.bind(this, agent)),
      agent.on('update', this._onUpdate.bind(this, agent)),
      agent.on('unmount', this._onUnmount.bind(this, agent)),
    ];
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

    this._measurer.request(node, this._onMeasureNode);
  }

  _onUnmount(agent: Agent, id: string) {

  }

  _onMeasureNode(measurement: Object) {
    this._presenter.present(measurement);
  }
}

module.exports = BananaSlugObserver;
