/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * A TodoMVC++ app for trying out the inspector
 *
 */
'use strict';

var React = require('react');
var ReactDOM = require('react-dom');

const { Component, Fragment, PureComponent, unstable_Profiler: Profiler } = React;

const onRender = (id, mode, actualTime, baseTime, startTime, commitTime) => {
  console.log(`${id}\t(${mode})\tactual:${actualTime}\tbase:${baseTime}\tstart:${startTime}\tcommit:${commitTime}`);
};

const App = () => (
  <Stateful />
);

class Stateful extends Component {
  state = {
    count: 1,
  };
  render() {
    return (
      <div>
        <button onClick={this.rerender}>
          Re-render with same props
        </button>
        <button onClick={this.updateCount}>
          Re-render with new props
        </button>
        <Shell count={this.state.count} />
      </div>
    );
  }
  rerender = () => this.forceUpdate();
  updateCount = () =>
    this.setState(prevState => ({
      count: prevState.count + 1,
    }));
}

function Shell({count}) {
  return (
    <Fragment>
      <Profiler id="GoodMemoization" onRender={onRender}>
        <div>
          <GoodMemoization count={count} />
        </div>
      </Profiler>
      <Profiler id="BadMemoization" onRender={onRender}>
        <div>
          {count % 2 ? <BadMemoization count={count} /> : null}
        </div>
      </Profiler>
    </Fragment>
  );
}

class BadMemoization extends Component {
  render() {
    return (
      <p>
        <label>BadMemoization</label>
        <SlowComponent/>
        <SlowComponent/>
        <SlowComponent/>
      </p>
    );
  }
}

class GoodMemoization extends PureComponent {
  render() {
    return (
      <p>
        <label>GoodMemoization</label>
        <SlowComponent/>
        <SlowComponent/>
        <SlowComponent/>
      </p>
    );
  }
}

const sleepFor = duration => {
  const now = new Date().getTime();
  while (new Date().getTime() < now + duration) {}
};

const SlowComponent = () => {
  sleepFor(10);
  return <span>SlowComponent</span>;
};

var node = document.createElement('div');
document.body.appendChild(node);
ReactDOM.render(<App />, node);
