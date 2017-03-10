/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

require('es6-map/implement');
require('es6-set/implement');

var test = require('tape');
var makeReporter = require('./reporter');
var spy = require('./spy');

var attachRenderer = require('../attachRenderer');
var globalHook = require('../GlobalHook.js');
globalHook(window);

if (!window.IS_TRAVIS) {
  makeReporter(test.createStream({objectMode: true}));
}

var React = require('./v0.14/node_modules/react');
var {EventEmitter} = require('events');

var renderers = window.__REACT_DEVTOOLS_GLOBAL_HOOK__._renderers;
var renderer = renderers[Object.keys(renderers)[0]];

function tracker(hook) {
  var els = new Map();
  var roots = new Set();
  hook.on('root', ({internalInstance}) => roots.add(internalInstance));
  hook.on('unmount', ({internalInstance}) => {
    roots.delete(internalInstance);
    els.delete(internalInstance);
  });
  hook.on('mount', ({internalInstance, data}) => {
    els.set(internalInstance, [data]);
  });
  hook.on('update', ({internalInstance, data}) => {
    els.get(internalInstance).push(data);
  });
  return {els, roots};
}

function setup(hook) {
  var handlers = {
    root: spy(),
    mount: spy(),
    update: spy(),
    unmount: spy(),
  };
  for (var name in handlers) {
    hook.on(name, handlers[name]);
  }
  return handlers;
}

function wrapElement(hook, element) {
  var extras = attachRenderer(hook, 'abc', renderer);
  var node = document.createElement('div');
  React.render(element, node);
  extras.cleanup();
  React.unmountComponentAtNode(node);
}

function wrapRender(hook, fn) {
  var extras = attachRenderer(hook, 'abc', renderer);
  fn();
  extras.cleanup();
}

var SimpleApp = React.createClass({
  render() {
    return <div>Hello</div>;
  },
});

// Mounting and Unmounting

test('should work with plain DOM node', t => {
  var hook = new EventEmitter();
  var handlers = setup(hook);

  wrapElement(hook, <div>Plain</div>);

  t.ok(handlers.root.calledOnce, 'One root');
  // the root-level wrapper, and the div
  t.equal(handlers.mount.callCount, 2, 'Two mounts');
  t.notOk(handlers.unmount.called, 'No unmounts');
  t.end();
});

test('should work with simple composite component', t => {
  var hook = new EventEmitter();
  var handlers = setup(hook);

  wrapElement(hook, <SimpleApp/>);

  t.ok(handlers.root.calledOnce, 'One root');
  // the root-level wrapper, the composite component, and the div
  t.equal(handlers.mount.callCount, 3, 'Three mounts');
  t.notOk(handlers.unmount.called, 'No unmounts');
  t.end();
});

test('attaching late should work', t => {
  var hook = new EventEmitter();
  var handlers = setup(hook);

  var node = document.createElement('div');
  React.render(<SimpleApp/>, node);

  var extras = attachRenderer(hook, 'abc', renderer);
  extras.walkTree((component, data) => handlers.mount({component, data}), component => handlers.root({component}));

  t.equal(handlers.root.callCount, 1, 'One root');
  // the root-level wrapper, the composite component, and the div
  t.equal(handlers.mount.callCount, 3, 'Three mounts');
  t.notOk(handlers.unmount.called, 'No unmounts');

  // cleanup after
  extras.cleanup();
  React.unmountComponentAtNode(node);

  t.end();
});

test('should unmount everything', t => {
  var hook = new EventEmitter();
  var els = new Set();
  hook.on('mount', ({internalInstance}) => els.add(internalInstance));
  hook.on('unmount', ({internalInstance}) => els.delete(internalInstance));

  wrapRender(hook, () => {
    var node = document.createElement('div');
    React.render(<SimpleApp/>, node);
    t.ok(els.size > 0, 'Some elements');
    React.unmountComponentAtNode(node);
  });

  t.equal(els.size, 0, 'Everything unmounted');
  t.end();
});

test('should register two roots', t => {
  var hook = new EventEmitter();
  var handlers = setup(hook);

  wrapRender(hook, () => {
    var node = document.createElement('div');
    var node2 = document.createElement('div');
    React.render(<SimpleApp/>, node);
    React.render(<SimpleApp/>, node2);
    React.unmountComponentAtNode(node);
    React.unmountComponentAtNode(node2);
  });

  t.equal(handlers.root.callCount, 2, 'Two roots');
  t.end();
});

test('Double render', t => {
  var hook = new EventEmitter();
  var handlers = setup(hook);
  var els = new Set();
  hook.on('mount', ({internalInstance}) => els.add(internalInstance));
  hook.on('unmount', ({internalInstance}) => els.delete(internalInstance));

  wrapNode(node => {
    wrapRender(hook, () => {
      React.render(<SimpleApp/>, node);
      t.equal(handlers.update.callCount, 0, 'No updates');
      React.render(<SimpleApp/>, node);
    });
  });

  t.equal(handlers.root.callCount, 1, 'One root');
  t.ok(handlers.update.callCount > 0, 'Updates');
  t.equal(els.size, 3, 'Only three mounted');
  t.end();
});

test('Plain text nodes', t => {
  var hook = new EventEmitter();
  var {roots, els} = tracker(hook);

  var PlainApp = React.createClass({
    render() {
      return <div>one{['two']}three</div>;
    },
  });
  wrapElement(hook, <PlainApp/>);

  var root = roots.values().next().value;
  var composite = els.get(root)[0].children[0];
  var div = els.get(composite)[0].children[0];
  var texts = els.get(div)[0].children;

  var contents = ['one', 'two', 'three'];

  t.equals(texts.length, 3, '3 text children');

  texts.forEach((comp, i) => {
    t.equals(els.get(comp)[0].text, contents[i], i + ') Text content correct');
    t.equals(els.get(comp)[0].nodeType, 'Text', i + ') NodeType = text');
  });

  t.end();
});

// State updating

var StateApp = React.createClass({
  getInitialState() {
    return {updated: false};
  },
  render() {
    return <div>{this.state.updated ? 'Updated' : 'Not updated'}</div>;
  },
});

function wrapNode(fn) {
  var node = document.createElement('div');
  fn(node);
  React.unmountComponentAtNode(node);
}

test('State update', t => {
  var hook = new EventEmitter();
  var {roots, els} = tracker(hook);

  wrapNode(node => {
    wrapRender(hook, () => {
      var App = React.render(<StateApp/>, node);
      App.setState({updated: true});
    });
  });

  var root = roots.values().next().value;
  var composite = els.get(root)[0].children[0];
  var div = els.get(composite)[0].children[0];

  var divUpdates = els.get(div);
  t.equal(divUpdates[0].nodeType, 'Native', '[Div] Native type');
  t.equal(divUpdates[0].name, 'div', 'Named "div"');
  t.equal(divUpdates[0].children, 'Not updated', 'At first, not updated');
  t.equal(divUpdates[1].children, 'Updated', 'Then, updated');
  var updates = els.get(composite);
  t.equal(updates[0].nodeType, 'Composite', '[App] Composite type');
  t.equal(updates[0].name, 'StateApp', 'Named "StateApp"');
  t.equal(updates[0].state.updated, false, 'State[0] updated=false');
  t.equal(updates[1].state.updated, true, 'State[1] updated=true');
  t.end();
});

test('Props update', t => {
  var hook = new EventEmitter();
  var {roots, els} = tracker(hook);

  var StateProps = React.createClass({
    getInitialState() {
      return {pass: false};
    },
    render() {
      return <SimpleApp pass={this.state.pass}/>;
    },
  });

  wrapNode(node => {
    wrapRender(hook, () => {
      var App = React.render(<StateProps/>, node);
      App.setState({pass: true});
      App.setState({pass: 100});
    });
  });

  var root = roots.values().next().value;
  var composite = els.get(root)[0].children[0];
  var simple = els.get(composite)[0].children[0];

  var updates = els.get(simple);
  t.equal(updates[0].props.pass, false, 't=0, prop=false');
  t.equal(updates[1].props.pass, true, 't=1, prop=true');
  t.equal(updates[2].props.pass, 100, 't=2, prop=100');
  t.end();
});
