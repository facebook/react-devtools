/** @flow **/

var React = require('react');

class Simple extends React.Component {
  constructor(props: Object) {
    super(props)
    this.state = {}
  }

  componentWillMount() {
    this.props.backend.on('root', () => this.setState());
  }

  render(): ReactElement {
    var roots = [];
    for (var root of this.props.backend.roots) {
      roots.push(
        <Tag map={this.props.backend.awesome} node={this.props.backend.awesome.get(root)}/>
      );
    }

    return (
      <div onClick={() => this.setState({})}>
        {roots}
      </div>
    );
  }
}

class Tag extends React.Component {
  constructor(props) {
    super(props)

    this.state = {}
  }

  componentWillMount() {
    /*this.props.backend.on('update', element => {
      if (element === this.props.node.children) {
        this.setState()
      }
    })*/
  }

  _renderChildren(children) {
    if (children.length && children.map) {
      return <ul style={styles.list}>
        {children.map(child => <li>{this._renderChildren(child)}</li>)}
      </ul>
    }
    if ('string' === typeof children) {
      return children
    }
    var node = this.props.map.get(children)
    if (node && 'string' === typeof node.type && 'string' === typeof this.props.node.type) {
      return this._renderChildren(node.children)
    }
    return <Tag map={this.props.map} node={node} />
  }

  render() {
    var node = this.props.node
    var children;
    if ('string' === typeof node.children) {
      children = node.children
    } else if (node.children) {
      children = this._renderChildren(node.children);
    } else if (!node.type) {
      return <div style={styles.text}>{node.name}</div>
    }
    return <div style={styles.tag}>
      <div onClick={() => window.sel = this.props.node} style={styles.head}>
        {'<' + node.name + '>'}
      </div>
      <div style={styles.body}>{children}</div>
      <div style={styles.head}>
        {'</' + node.name + '>'}
      </div>
    </div>
  }
}

var styles = {
  text: {
    fontWeight: 'bold',
  },

  body: {
    paddingLeft: 20,
  },

  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },

  tag: {
    //marginLeft: 20,
  },

  head: {
    // backgroundColor: '#dda',
  },
}

module.exports = Simple
