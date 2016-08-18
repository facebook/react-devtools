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

const BananaSlugAbstractNodeMeasurer = require('./BananaSlugAbstractNodeMeasurer');
const BananaSlugAbstractNodePresenter = require('./BananaSlugAbstractNodePresenter');
const BananaSlugWebNodeMeasurer = require('./BananaSlugWebNodeMeasurer');
const BananaSlugWebNodePresenter = require('./BananaSlugWebNodePresenter');

import type {
  Agent,
  Measurement,
  Measurer,
  Presenter,
} from './BananaSlugTypes';

import type {ControlState} from '../../frontend/types.js';

const NODE_TYPE_COMPOSITE = 'Composite';

class BananaSlugBackendManager {
  _onMeasureNode: () => void;
  _measurer: Measurer;
  _presenter: Presenter;
  _isActive: boolean;

  constructor(agent: Agent) {
    this._onMeasureNode = this._onMeasureNode.bind(this);

    var useDOM = agent.capabilities.dom;

    this._measurer = useDOM ?
      new BananaSlugWebNodeMeasurer() :
      new BananaSlugAbstractNodeMeasurer();

    this._presenter = useDOM ?
      new BananaSlugWebNodePresenter() :
      new BananaSlugAbstractNodePresenter();

    this._isActive = false;
    agent.on('bananaslugchange', this._onBananaSlugChange.bind(this));
    agent.on('update', this._onUpdate.bind(this, agent));
    agent.on('shutdown', this._shutdown.bind(this));
  }

  _onUpdate(agent: Agent, obj: any) {
    if (
      !this._isActive ||
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

  _onMeasureNode(measurement: Measurement): void {
    this._presenter.present(measurement);
  }

  _onBananaSlugChange(state: ControlState): void {
    this._isActive = state.enabled;
    this._presenter.setEnabled(state.enabled);
  }

  _shutdown(): void {
    this._isActive = false;
    this._presenter.setEnabled(false);
  }
}

function init(agent: Agent): BananaSlugBackendManager {
  return new BananaSlugBackendManager(agent);
}

module.exports = {
  init,
};
