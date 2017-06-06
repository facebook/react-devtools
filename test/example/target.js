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

console.log(React);
console.log(ReactDOM);

class App extends React.Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h2>Welcome to React</h2>
          <div>
            123
            <div>
              {
                [
                  <div>
                    <div>
                      <div>
                        <span>123</span>
                      </div>
                    </div>
                  </div>,
                  <span>123</span>,
                  <span>123</span>,
                ]
              }
              <div>
                <div>
                  <div>
                    <span>123</span>
                  </div>
                </div>
              </div>
              <span>123</span>
              <span>123</span>
              <span>123</span>
              <span>123</span>
            </div>
          </div>
        </div>
        {
          ["foo", "bar", "baz", "fiber"].map((str) => <div key={str}>{str}</div>)
        }
        {
          ['123', '456', <div>Hello world</div>]
        }
        {
          [[[[[[[[[[[[[['Hello world lol', <div><div>123</div></div>]]]]]]]]]]]]]]
        }
      </div>
    );
  }
}

var node = document.createElement('div');
document.body.appendChild(node);
ReactDOM.render(<App />, node);
