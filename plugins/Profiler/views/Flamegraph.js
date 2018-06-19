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

// $FlowFixMe
import React, { createRef, Component } from 'react';
import { select } from 'd3';

import createFlamegraph from './createFlamegraph';

require('./d3-graph.css');

export type Node = {|
  children: Array<Node>,
  color: string,
  id: any,
  label: string,
  tooltip: string,
  value: number,
|};

type Props = {|
  data: Node,
  height: number,
  width: number,
|};

class Flamegraph extends Component<Props, void> {
  flamegraph: any = null;
  ref = createRef();

  componentDidMount() {
    this.createFlamegraph();
  }

  componentDidUpdate(prevProps: Props) {
    const { data, width } = this.props;

    if (data !== prevProps.data) {
      this.flamegraph.clear();
      this.flamegraph.merge(data);
    } else if (width !== prevProps.width) {
      this.flamegraph.setWidth(width).update();
    }
  }

  render() {
    const { height, width } = this.props;
    return (
      <div style={{ height, width, overflow: 'auto' }}>
        <div ref={this.ref} />
      </div>
    );
  }

  createFlamegraph() {
    const { data, width } = this.props;

    this.flamegraph = createFlamegraph(width);

    this.ref.current.innerHTML = '';

    select(this.ref.current)
      .datum(data)
      .call(this.flamegraph);
  }
}

module.exports = Flamegraph;
