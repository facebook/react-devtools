
var Panel = require('./Panel');
var React = require('react');

var node = document.getElementById('container');

function reload() {
  React.unmountComponentAtNode(node);
  node.innerHTML = '';
  React.render(<Panel reload={reload} />, node);
}

React.render(<Panel reload={reload} />, node);

