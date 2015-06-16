
var React = require('react');

module.exports = (options, Component) => {
  class Wrapper extends React.Component {
    constructor() {
      super()
      this.state = {}
    }

    shouldComponentUpdate(nextProps, nextState) {
      if (nextState !== this.state) {
        return true;
      }
      if (options.shouldUpdate) {
        return options.shouldUpdate(nextProps, this.props)
      }
      return false;
    }

    componentWillMount() {
      this._update = () => this.forceUpdate();
      this._listeners = options.listeners(this.props);
      this._listeners.forEach(evt => {
        this.context.store.on(evt, this._update);
      });
    }

    componentWillUnmount() {
      this._listeners.forEach(evt => {
        this.context.store.off(evt, this._update);
      });
    }

    render() {
      var store = this.context.store;
      var props = options.props(store, this.props);
      return <Component {...props} {...this.props} />;
    }
  }

  Wrapper.contextTypes = {
    store: React.PropTypes.object,
  };

  return Wrapper;
};

