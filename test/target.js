
var React = require('react');
require('../backend/compat');

class Wrap extends React.Component {
  render() {
    return <div>
      <span awesome={2} thing={[1,2,3]} more={{2:3}}/>
      <div>&lt;</div>
      <Target count={3}/>
    </div>
  }
}

class Target extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      awesome: false,
      num: this.props.count || 5,
    }
  }

  render() {
    if (this.state.num === 1) {
      return <div onClick={() => this.setState({awesome: !this.state.awesome})}>
        {'' + !!this.state.awesome}
      </div>
    }
    var count = this.state.num;
    var children = []
    for (var i=0; i<count; i++) {
      children.push(<Target key={Math.random()} count={count-1}/>);
    }
    return <div style={{
      margin: 5,
      marginLeft: 10,
      border: '2px solid #ccc',
    }}>
      {count} : {this.state.num} / {'' + !!this.state.awesome}
      {children}
    </div>
  }
}

var node = document.createElement('div');
document.body.appendChild(node)
React.render(<Wrap awesome={1}/>, node);

