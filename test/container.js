
var Harness = require('../frontend/harness');
var Container = require('../frontend/container');
var React = require('react');
__REACT_DEVTOOLS_GLOBAL_HOOK__.React = React;

window.React = React;

var node = document.createElement('div')
document.body.appendChild(node)
React.render(
  <Harness targetSrc="./build/target.js">
    <Container/>
  </Harness>,
  node
)


