
var React = require('react');
var assign = require('object-assign');

var styles = {
}

class One {
  render() {
    return <h1>One</h1>
  }
}

class Two {
  render() {
    return <h1>Two</h1>
  }
}

class Three {
  render() {
    return <h1>Three</h1>
  }
}

function make(Comp) {
  var el = <Comp val={Math.random().toString(0x0f)} />;
  var node = document.createElement('div');
  document.body.appendChild(node)
  React.render(el, node);
  return node;
}

function removing(Comp, next) {
  var node = make(Comp);
  setTimeout(function () {
    React.unmountComponentAtNode(node);
    if (next) next();
    else removing(Comp);
  }, Math.random() * 1000 + 1000);
}

removing(One);
removing(Two);
removing(Three);
removing(One);
make(Two);
make(Three);

