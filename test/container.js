
var Harness = require('../frontend/harness');
var Container = require('../frontend/container');
var React = require('react');

window.React = React;

var node = document.createElement('div')
document.body.appendChild(node)
React.render(
  <Harness backendSrc="./build/backend.js" targetSrc="./build/target.js">
    <Container/>
  </Harness>,
  node
)


