
var Harness = require('../frontend/Harness');
var Simple = require('../frontend/Simple');
var React = require('react');

var node = document.createElement('div')
document.body.appendChild(node)
React.render(
  <Harness targetSrc="./build/target.js">
    <Simple/>
  </Harness>,
  node
)

