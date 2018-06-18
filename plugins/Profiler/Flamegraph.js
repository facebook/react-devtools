import React, { createRef, Component } from 'react';
import { select } from 'd3';

import createFlamegraph from './createFlamegraph';

export type Node = {|
  children: Array<Node>,
  color: string,
  name: string,
  value: number,
|};

type FlamegraphProps = {|
  data: Node,
  height: number,
  width: number,
|};

class Flamegraph extends Component<FlamegraphProps, void> {
  ref = createRef();

  componentDidMount() {
    this.createFlamegraph();
  }

  componentDidUpdate(prevProps) {
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
