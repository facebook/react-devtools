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
const PropTypes = require('prop-types');
const ScheduleTracing = require('scheduler/tracing');
const Immutable = require('immutable');
const assign = require('object-assign');
const guid = require('../../utils/guid');

const { unstable_trace: trace } = ScheduleTracing;

const Greeting = ({ forwardedRef, name }) => <div ref={forwardedRef}>Hello, {name}</div>;
const ForwardedGreeting = React.forwardRef((props, ref) => <Greeting {...props} forwardedRef={ref} />);
const MemoizedGreeting = React.memo(Greeting);

const themes = {
  blue: {
    primary: '#2962ff',
    contrast: '#fff',
  },
  red: {
    primary: '#d50000',
    contrast: '#fff',
  },
};
const ThemeContext = React.createContext();
ThemeContext.displayName = 'ThemeContext';

const LocaleContext = React.createContext('en-US');

const {useCallback, useDebugValue, useEffect, useState} = React;

// Below copied from https://usehooks.com/
function useDebounce(value, delay) {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);

  // Show the value in DevTools
  useDebugValue(debouncedValue);

  useEffect(
    () => {
      // Update debounced value after delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. within the delay period. Timeout gets cleared and restarted.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Only re-call effect if value or delay changes
  );

  return debouncedValue;
}
// Above copied from https://usehooks.com/

function useNestedInnerHook() {
  return useState(123);
}
function useNestedOuterHook() {
  return useNestedInnerHook();
}

const hooksTestProps = {
  string: 'abc',
  number: 123,
  nestedObject:  {
    boolean: true,
  },
  nestedArray: ['a', 'b', 'c'],
};

function FunctionWithHooks(props, ref) {
  const [count, updateCount] = useState(0);

  // Custom hook with a custom debug label
  const debouncedCount = useDebounce(count, 1000);

  const onClick = useCallback(function onClick() {
    updateCount(count + 1);
  }, [count]);

  // Tests nested custom hooks
  useNestedOuterHook();

  return (
    <button onClick={onClick}>
      Count: {debouncedCount}
    </button>
  );
}
const MemoWithHooks = React.memo(FunctionWithHooks);
const ForwardRefWithHooks = React.forwardRef(FunctionWithHooks);

class Todos extends React.Component {
  ref = React.createRef();

  constructor(props) {
    super(props);
    this._nextid = 50;
    this.state = {
      todos: [
        {title: 'Inspect all the things', completed: true, id: 10},
        {title: 'Profit!!', completed: false, id: 11},
        {title: 'Profit!!', completed: false, id: 12},
      ],
      filter: 'All',
    };
  }

  onAdd(text) {
    if (!text.trim().length) {
      return;
    }
    trace(`Add "${text}"`, performance.now(), () =>
      this.setState({
        todos: this.state.todos.concat([{
          title: text,
          completed: false,
          id: this._nextid++,
        }]),
      }));
  }

  toggleComplete(id, completed) {
    var todos = this.state.todos.slice();
    let text;
    todos.some(item => {
      if (item.id === id) {
        item.completed = completed;
        text = item.title;
        return true;
      }
      return false;
    });
    trace(`Toggle "${text}" ${completed ? 'complete' : 'incomplete'}`, performance.now(), () =>
      this.setState({todos}));
  }

  sort() {
    var todos = this.state.todos.slice();
    todos.sort((a, b) => {
      if (a.title === b.title) {
        return 0;
      }
      return a.title > b.title ? 1 : -1;
    });
    trace('Sorting items', performance.now(), () =>
      this.setState({todos}));
  }

  changeFilter(val) {
    trace(`Filter by "${val}"`, performance.now(), () =>
      this.setState({
        filter: val,
      }));
  }

  render() {
    return (
      <div style={styles.container}>
        <ForwardedGreeting ref={this.ref} name="Brian" />
        <MemoizedGreeting name="Memoized" />
        <ThemeContext.Consumer>
          {theme => (
            <h1 style={{
              ...styles.title,
              color: theme.primary,
            }}>Things to do</h1>
          )}
        </ThemeContext.Consumer>
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
        <ThemeContext.Consumer>
          {theme => (
            <button
              onClick={this.submit.bind(this)}
              style={{
                ...styles.addButton,
                color: theme.primary,
              }}
            >
              +
            </button>
          )}
        </ThemeContext.Consumer>
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
    <ThemeContext.Consumer>
      {theme => (
        <div style={styles.filter}>
          {options.map(text => (
            <button
              key={text}
              style={{
                ...styles.filterButton,
                backgroundColor: text === props.filter ? theme.primary : undefined,
                color: text === props.filter ? theme.contrast : undefined,
              }}
              onClick={props.onFilter.bind(null, text)}
            >{text}</button>
          ))}
          {/*<button onClick={this.props.onSort} style={styles.filterButton}>Sort</button>*/}
        </div>
      )}
    </ThemeContext.Consumer>
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
    margin: '20px auto',
  },

  filterButton: {
    padding: '5px 10px',
    border: '3px solid #fff',
    outline: 'none',
    margin: '0 5px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
  },

  title: {
    margin: 0,
    fontSize: 25,
    marginBottom: 10,
  },
  content: {
    fontSize: 16,
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
  constructor(props) {
    super(props);
    this.state = {
      theme: themes.blue,
    };
  }

  toggleTheme() {
    this.setState(({ theme }) => ({
      theme: theme === themes.blue ? themes.red : themes.blue,
    }));
  }

  render() {
    return (
      <ThemeContext.Provider value={this.state.theme}>
        <div>
          <div style={styles.iframeWatermark}>
            this is an iframe
          </div>
          {/* for testing highlighing in the presence of multiple scrolls
          {long(long(long()))} {/* */}
          <Todos/>
          <center>
            <button onClick={this.toggleTheme.bind(this)}>Toggle color</button>
          </center>
          <center>
            <FunctionWithHooks props={hooksTestProps} />
            <MemoWithHooks props={hooksTestProps} />
            <ForwardRefWithHooks props={hooksTestProps} />
          </center>
          {/*<span thing={someVal}/>
          <Target count={1}/>
          <span awesome={2} thing={[1,2,3]} more={{2:3}}/>
          <span val={null}/>
          <span val={undefined}/>
          <div>&lt;</div>*/}
          <div style={styles.container}>
            <div style={styles.title}>Context tests</div>
            <div style={styles.content}>
              <SimpleContextType />
              <ObjectContextType />
              <LegacyContextTypes />
            </div>
          </div>
          <DeeplyNested />
          <PropTester awesome={2}/>
          <PropTester {...emptyProps}/>
          <PropTester {...primitiveProps}/>
          <PropTester {...complexProps}/>
          <PropTester {...uninspectableProps}/>
          <PropTester massiveMap={massiveMap}/>
        </div>
      </ThemeContext.Provider>
    );
  }
}

class PropTester extends React.Component {
  render() {
    return null;
  }
}

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

class SimpleContextType extends React.Component {
  static contextType = LocaleContext;

  render() {
    return (
      <div>
        Simple: {this.context}
      </div>
    );
  }
}

class ObjectContextType extends React.Component {
  static contextType = ThemeContext;

  render() {
    const theme = this.context;
    return (
      <div>
        Object: <span style={{color: theme.contrast, backgroundColor: theme.primary}}>theme</span>
      </div>
    );
  }
}

class LegacyContextTypes extends React.Component {
  static childContextTypes = {
    locale: PropTypes.string,
    theme: PropTypes.object,
  };

  getChildContext() {
    return {
      locale: 'en-US',
      theme: themes.blue,
    };
  }

  render() {
    return <LegacyContextTypesConsumer />;
  }
}
class LegacyContextTypesConsumer extends React.Component {
  static contextTypes = {
    locale: PropTypes.string,
    theme: PropTypes.object,
  };

  render() {
    const { locale, theme } = this.context;
    return (
      <div>
        Legacy: {locale}, <span style={{color: theme.contrast, backgroundColor: theme.primary}}>theme</span>
      </div>
    );
  }
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

trace('initial render', performance.now(), () => {
  var node = document.createElement('div');
  document.body.appendChild(node);
  ReactDOM.render(<Wrap />, node);
});
