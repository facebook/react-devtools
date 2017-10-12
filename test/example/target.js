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
var Immutable = require('immutable');
var assign = require('object-assign');
var guid = require('../../utils/guid');

class Todos extends React.Component {
  constructor(props) {
    super(props);
    this._nextid = 50;
    this.state = {
      todos: [
        {title: 'Inspect all the things', completed: true, id: 10},
        {title: 'Profit!!', completed: false, id: 11},
        {title: 'Profit!!', completed: false, id: 12},
        /*
        {title: 'Profit!!', completed: false, id: 13},
        {title: 'Profit!!', completed: false, id: 14},
        {title: 'Profit!!', completed: false, id: 15},
        {title: 'Profit!!', completed: false, id: 16},
        {title: 'Profit!!', completed: false, id: 17},
        {title: 'Profit!!', completed: false, id: 18},
        {title: 'Profit!!', completed: false, id: 19},
        {title: 'Profit!!', completed: false, id: 21},
        {title: 'Profit!!', completed: false, id: 41},
        */
      ],
      filter: 'All',
    };
  }

  onAdd(text) {
    if (!text.trim().length) {
      return;
    }
    this.setState({
      todos: this.state.todos.concat([{
        title: text,
        completed: false,
        id: this._nextid++,
      }]),
    });
  }

  toggleComplete(id, completed) {
    var todos = this.state.todos.slice();
    todos.some(item => {
      if (item.id === id) {
        item.completed = completed;
        return true;
      }
      return false;
    });
    this.setState({todos});
  }

  sort() {
    var todos = this.state.todos.slice();
    todos.sort((a, b) => {
      if (a.title === b.title) {
        return 0;
      }
      return a.title > b.title ? 1 : -1;
    });
    this.setState({todos});
  }

  changeFilter(val) {
    this.setState({
      filter: val,
    });
  }

  render() {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Things to do</h1>
        <NewTodo onAdd={this.onAdd.bind(this)} />
        <TodoItems
          todos={this.state.todos}
          filter={this.state.filter}
          onToggleComplete={this.toggleComplete.bind(this)}
        />
        <Filter onSort={this.sort.bind(this)} onFilter={this.changeFilter.bind(this)} filter={this.state.filter} />
      </div>
    );
  }
}

class NewTodo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {text: ''};
  }

  shouldComponentUpdate(prevProps, prevState) {
    return prevState !== this.state;
  }

  checkEnter(e) {
    if (e.key === 'Enter') {
      this.submit();
    }
  }

  submit() {
    this.props.onAdd(this.state.text);
    this.setState({text: ''});
  }

  render() {
    return (
      <div style={styles.newContainer}>
        <input
          style={styles.newInput}
          value={this.state.text}
          placeholder="Add new item"
          onKeyDown={e => this.checkEnter(e)}
          onChange={e => this.setState({text: e.target.value})}
        />
        <button onClick={this.submit.bind(this)} style={styles.addButton}>
          +
        </button>
      </div>
    );
  }
}

class TodoItems extends React.Component {
  render() {
    var filterFn = {
      All: () => true,
      Completed: item => item.completed,
      Remaining: item => !item.completed,
    }[this.props.filter];
    return (
      <ul style={styles.todos}>
        {this.props.todos.filter(filterFn).map(item => (
          <TodoItem
            item={item}
            key={item.id}
            onToggle={() => this.props.onToggleComplete(item.id, !item.completed)}
          />
        ))}
      </ul>
    );
  }
}

class TodoItem extends React.Component {
  render() {
    return (
      <li onClick={this.props.onToggle}>
        <HoverHighlight style={styles.todo}>
          <input
            type="checkbox"
            style={styles.checkbox}
            readOnly={true}
            checked={this.props.item.completed}
          />
          {this.props.item.title}
        </HoverHighlight>
      </li>
    );
  }
}

class HoverHighlight extends React.Component {
  constructor(props) {
    super(props);
    this.state = {hover: false};
  }

  render() {
    return (
      <div
        onMouseOver={() => this.setState({hover: true})}
        onMouseOut={() => this.setState({hover: false})}
        style={assign({}, this.props.style, {
          backgroundColor: this.state.hover ? '#eee' : 'transparent',
        })}>
        {this.props.children}
      </div>
    );
  }
}

function Filter(props) {
  var options = ['All', 'Completed', 'Remaining'];
  return (
    <div style={styles.filter}>
      {options.map(text => (
        <button
          key={text}
          style={assign({}, styles.filterButton, text === props.filter && styles.filterButtonActive)}
          onClick={props.onFilter.bind(null, text)}
        >{text}</button>
      ))}
      {/*<button onClick={this.props.onSort} style={styles.filterButton}>Sort</button>*/}
    </div>
  );
}

var styles = {
  container: {
    fontSize: 20,
    fontFamily: 'sans-serif',
    padding: 30,
    boxShadow: '0 2px 5px #ccc',
    width: 300,
    textAlign: 'center',
    margin: '50px auto',
  },

  filterButton: {
    padding: '5px 10px',
    border: '3px solid #fff',
    outline: 'none',
    margin: '0 5px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
  },

  filterButtonActive: {
    backgroundColor: '#eef',
  },

  title: {
    margin: 0,
    fontSize: 25,
    marginBottom: 10,
  },
  newInput: {
    padding: '5px 10px',
    fontSize: 16,
  },
  addButton: {
    padding: '0px 8px 5px 7px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 10,
    fontSize: 25,
    fontWeight: 'bold',
    marginLeft: 6,
    lineHeight: '24px',
    cursor: 'pointer',
  },

  checkbox: {
    marginRight: 20,
    position: 'relative',
    cursor: 'pointer',
    top: -2,
  },
  todos: {
    listStyle: 'none',
    textAlign: 'left',
    margin: 0,
    padding: 10,
  },
  todo: {
    padding: '10px 20px',
    cursor: 'pointer',
  },

  iframeWatermark: {
    position: 'absolute',
    top: 20,
    left: 20,
    fontSize: 25,
    color: '#ccc',
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
  },

  longStyle: {
    fontSize: 30,
    width: 200,
    whiteSpace: 'wrap',
    wordBreak: 'break-word',
    wordWrap: 'wrap',
    backgroundColor: 'rgba(100, 100, 200, .3)',
    height: 200,
    overflow: 'auto',
  },
};

// Test Properties for previewing pane
var emptyProps = {
  emptyObj: {},
  emptySet: new Set(),
  emptyMap: new Map(),
};
var primitiveProps = {
  aString: 'Hello',
  bool: true,
  num: 1312,
  unknown: undefined,
  notThere: null,
};
var complexProps = {
  array: [1, 2, 3, 4],
  set: new Set(['a', 2, 'c', 4]),
  simpleMap: new Map([
    ['a', true],
    ['b', [1, 2, 3]],
    ['c', { k1: 'v1', k2: 'v2' }],
    [1, 789],
    [2, 654],
    [3, null],
  ]),
  objMap: new Map([
    [{ a: 'a'}, true],
    [{ a: 'a'}, false],
    [{ b: 'b'}, [1, 2, 3]],
    [{ c: 'c'}, { k1: 'v1', k2: 'v2' }],
  ]),
  nestedObj: {
    a: {
      ab: {
        aba: 1,
        abb: 2,
        abc: 3,
      },
    },
    b: {
      ba: 1,
      bb: [
        1,
        2,
        3,
        4,
        {
          x: 1,
          y: 'hello',
          z: false,
        },
      ],
    },
    c: 1,
  },
  twoDimMatrix: [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ],
  tuplesArray: [
    [1, 2],
    [3, 4],
    [5, 6],
    [7, 8],
    [9, 10],
  ],
  tuplesSet: new Set([
    [1, 2],
    [3, 4],
    [5, 6],
    [7, 8],
    [9, 10],
  ]),
  typedArray: Int8Array.from([128, -127, 255]),
  immutableThings: Immutable.fromJS({
    a: [
      { hello: 'there' },
      'fixed',
      true,
    ],
    b: 123,
    c: {
      '1': 'xyz',
      xyz: 1,
    },
  }),
};
var uninspectableProps = {
  a: new ArrayBuffer(256),
  b: new DataView(new ArrayBuffer(128)),
};
var massiveMap = new Map();

for (var mCount = 200; mCount--;) {
  massiveMap.set(`entry-${mCount}`, mCount);
}


class Wrap extends React.Component {
  render() {
    return (
      <div>
        <div style={styles.iframeWatermark}>
          this is an iframe
        </div>
        {/* for testing highlighing in the presence of multiple scrolls
        {long(long(long()))} {/* */}
        <Todos/>
        {/*<span thing={someVal}/>
        <Target count={1}/>
        <span awesome={2} thing={[1,2,3]} more={{2:3}}/>
        <span val={null}/>
        <span val={undefined}/>
        <div>&lt;</div>*/}
        <DeeplyNested />
        <PropTester awesome={2}/>
        <PropTester {...emptyProps}/>
        <PropTester {...primitiveProps}/>
        <PropTester {...complexProps}/>
        <PropTester {...uninspectableProps}/>
        <PropTester massiveMap={massiveMap}/>
      </div>
    );
  }
}

var PropTester = React.createClass({
  render() {
    return null;
  },
});

class Nested extends React.Component {
  render() {
    return (
      <div style={styles.container}>Deeply Nested Component</div>
    );
  }
}

function wrapWithHoc(Component) {
  class HigherOrderComponent extends React.Component {
    render() {
      return <div><Component /></div>;
    }
  }

  return HigherOrderComponent;
}

function wrapMultipleNested(Component, times) {
  for (var i = 0; i < times; i++) {
    Component = wrapWithHoc(Component);
  }

  return Component;
}

var DeeplyNested = wrapMultipleNested(Nested, 50);

function long(children) { // eslint-disable-line no-unused-vars
  return (
    <div style={styles.longStyle}>
      <div>Hello</div>
      <div>Hello</div>
      <div>Hello</div>
      <div>Hello</div>
      <div>Hello</div>
      <div>Hello</div>
      <div>Hello</div>
      <div>Hello</div>
      <div>Hello</div>
      <div>Hello</div>
      <div>Hello</div>
      <div>Hello</div>
      <div>Hello</div>
      <div>Hello</div>
      <div>Hello</div>
      <div>Hello</div>
      <div>Hello</div>
      <div>Hello</div>
      {children}
    </div>
  );
}

class Target extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      awesome: false,
      num: this.props.count || 5,
    };
  }

  render() {
    if (this.state.num === 1) {
      return (
        <div onClick={() => this.setState({awesome: !this.state.awesome})}>
          {'' + !!this.state.awesome}
        </div>
      );
    }
    var count = this.state.num;
    var children = [];
    for (var i = 0; i < count; i++) {
      children.push(<Target key={guid()} count={count - 1}/>);
    }
    return (
      <div style={{
        margin: 5,
        marginLeft: 10,
        border: '2px solid #ccc',
      }}>
        {count} : {this.state.num} / {'' + !!this.state.awesome}
        {children}
      </div>
    );
  }
}

var node = document.createElement('div');
document.body.appendChild(node);
ReactDOM.render(<Wrap />, node);
