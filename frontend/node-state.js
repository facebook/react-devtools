
var React = require('react');

module.exports = Component => {
  class Wrapper extends React.Component {
    constructor() {
      super()
      this.state = {}
    }

    shouldComponentUpdate(nextProps, nextState) {
      return nextProps.id !== this.props.id || nextState !== this.state;
    }

    componentWillMount() {
      this._update = () => {
        this.setState({});
      }
      this.context.store.on(this.props.id, this._update);
    }

    componentWillUnmount() {
      this.context.store.off(this.props.id, this._update);
    }

    render() {
      var store = this.context.store;
      var node = store.get(this.props.id);
      if (!node) return <span>Loading</span>;
      return (
        <Component
          onToggleCollapse={() => store.toggleCollapse(this.props.id)}
          onHover={isHovered => store.setHover(this.props.id, isHovered)}
          onSelect={() => store.select(this.props.id)}
          node={store.get(this.props.id)}
          depth={this.props.depth}
          id={this.props.id}
        />
      );
    }
  }

  Wrapper.contextTypes = {
    store: React.PropTypes.object,
  };

  return Wrapper;
};

