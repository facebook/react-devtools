
var React = require('react');

function setToArray(set) {
  var res = [];
  for (var val of set) {
    res.push(val);
  }
  return res;
}

function arrayDiff(array, oldArray) {
  var names = new Set();
  var missing = [];
  for (var i=0; i<array.length; i++) {
    names.add(array[i]);
  }
  for (var i=0; i<oldArray.length; i++) {
    if (!names.has(oldArray[i])) {
      missing.push(oldArray[i]);
    } else {
      names.delete(oldArray[i]);
    }
  }
  return {
    missing,
    newItems: setToArray(names),
  }
}

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

    componentWillUpdate(nextProps, nextState) {
      var listeners = options.listeners(this.props, this.context.store);
      var diff = arrayDiff(listeners, this._listeners);
      diff.missing.forEach(name => {
        this.context.store.off(name, this._update);
      });
      diff.newItems.forEach(name => {
        this.context.store.on(name, this._update);
      });
      this._listeners = listeners;
    }

    componentWillMount() {
      this._update = () => this.forceUpdate();
      this._listeners = options.listeners(this.props, this.context.store);
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

