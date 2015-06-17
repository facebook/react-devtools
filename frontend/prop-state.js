
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

    var nodeType = this.props.node.get('nodeType');
    if (nodeType === 'Text') {
      return (
        <div style={styles.container}>
          Text node (no props/state)
        </div>
      );
    }

    var state = this.props.node.get('state');

    return (
      <div style={styles.container}>
        <strong>Props</strong>
        <DataView readOnly={true} key={Math.random()} data={this.props.node.get('props')} />
        {state &&
          <div>
            <strong>State</strong>
            <DataView key={Math.random()} data={state} />
          </div>}
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
  listeners(props, store) {
    return ['selected', store.selected];
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
    width: 300,
  },
};

module.exports = WrappedPropState;
