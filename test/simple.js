
var Harness = require('../frontend/harness');
var Simple = require('../frontend/simple');
var React = require('react');

var node = document.createElement('div')
document.body.appendChild(node)
React.render(
  <Harness targetSrc="./build/target.js">
    <Simple/>
  </Harness>,
  node
)

