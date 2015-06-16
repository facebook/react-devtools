
var React = require('react');
var DataView = require('./data-view');
var decorate = require('./decorate');

class PropState extends React.Component {
  getChildContext() {
    return {
      onChange: (path, val) => {
        this.props.setState(path, val);
      }
    };
  }

  render() {
    if (!this.props.node) {
      return <span>No selection</span>;
    }

    return (
      <div style={styles.container}>
        <strong>Props</strong>
        <DataView readOnly={true} key={Math.random()} data={this.props.node.get('props')} />
        <br/>
        <strong>State</strong>
        <DataView key={Math.random()} data={this.props.node.get('state')} />
      </div>
    );
  }
}

PropState.childContextTypes = {
  onChange: React.PropTypes.func,
}

var toStr = val => {
  try {
    return JSON.stringify(val);
  } catch (e) {}
  return '' + val;
}

var WrappedPropState = decorate({
  listeners() {
    return ['selected'];
  },
  props(store) {
    return {
      node: store.selected ? store.get(store.selected) : null,
      setState(path, val) {
        store.setState(store.selected, path, val);
      },
    };
  }
}, PropState);

var styles = {
  container: {
    border: '2px solid green',
  },
};

module.exports = WrappedPropState;
