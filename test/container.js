
var Harness = require('../frontend/harness');
var Container = require('../frontend/container');
var React = require('react');

var node = document.createElement('div')
document.body.appendChild(node)
React.render(
  <Harness targetSrc="./build/target.js">
    <Container/>
  </Harness>,
  node
)


