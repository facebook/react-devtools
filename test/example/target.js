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
      time: new Date(),
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
        time: JSON.stringify(new Date()).replace(/\/"/, ''),
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

class Filter extends React.Component {
  render() {
    var options = ['All', 'Completed', 'Remaining'];
    return (
      <div style={styles.filter}>
        {options.map(text => (
          <button
            key={text}
            style={assign({}, styles.filterButton, text === this.props.filter && styles.filterButtonActive)}
            onClick={this.props.onFilter.bind(null, text)}
          >{text}</button>
        ))}
        {/*<button onClick={this.props.onSort} style={styles.filterButton}>Sort</button>*/}
      </div>
    );
  }
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

class Something {
  doot() {
    return 10;
  }
}

var someVal = new Something();
someVal.awesome = 2;

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
        <OldStyle awesome={2}/>
      </div>
    );
  }
}

var OldStyle = React.createClass({
  render() {
    return <span>OldStyle {this.props.awesome}</span>;
  },
});

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
ReactDOM.render(<Wrap more={['a', 2, 'c', 4]} str="thing" awesome={1} />, node);
