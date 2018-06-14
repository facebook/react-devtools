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

const React = require('react');
const ReactDOM = require('react-dom');

const { Component, Fragment, unstable_Profiler: Profiler } = React;

const onRender = (id, mode, actualTime, baseTime, startTime, commitTime) => {
  console.log(`${id}\t(${mode})\tactual:${actualTime}\tbase:${baseTime}\tstart:${startTime}\tcommit:${commitTime}`);
};

let instance;

class App extends Component {
  state = {
    count: 1,
  };
  render() {
    instance = this;
    const { count } = this.state;
    return count % 2 === 1
      ? <Fragment><A count={count} /><B count={count} /></Fragment>
      : <Fragment><A count={count} /><E count={count} /></Fragment>;
  }
  updateCount = () =>
    this.setState(prevState => ({
      count: prevState.count + 1,
    }));
}

const sleepFor = duration => {
  const now = new Date().getTime();
  while (new Date().getTime() < now + duration) {}
};

const A = ({ count }) => {
  sleepFor(5);
  return count % 2 === 1 ? count : <D count={count} />;
};
const C = ({ count }) => {
  sleepFor(3);
  return count;
};
const B = ({count}) => {
  sleepFor(4);
  return <C count={count} />;
};
const D = ({ count }) => {
  sleepFor(9);
  return count;
};
const E = ({ count }) => {
  sleepFor(11);
  return count;
};

var node = document.createElement('div');
document.body.appendChild(node);
ReactDOM.render(
  <Profiler id="root" onRender={onRender}>
    <App />
  </Profiler>,
  node
);

document.body.addEventListener('click', () => {
  instance.updateCount();
});
