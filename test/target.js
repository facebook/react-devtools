
var React = require('react');
require('../backend/compat');

class Wrap extends React.Component {
  render() {
    return <Target count={4}/>
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
    if (this.props.count === 1) {
      return <div onClick={() => this.setState({awesome: true})}>
        {'' + !!this.state.awesome}
      </div>
    }
    var count = this.props.count || 5
    var children = []
    for (var i=0; i<count; i++) {
      children.push(<Target key={i} count={count-1}/>);
    }
    return <div style={{
      margin: 5,
      marginLeft: 10,
      border: '2px solid #ccc',
    }}>
      {count}
      {children}
    </div>
  }
}

var node = document.createElement('div');
document.body.appendChild(node)
React.render(<Wrap awesome={1}/>, node);

