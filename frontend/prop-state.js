
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
        <div style={styles.header}>
          <div style={styles.headerName}>
            &lt;{this.props.node.get('name')}&gt;
          </div>
          {nodeType === 'Custom' &&
            <button style={styles.globalButton} onClick={() => this.props.makeGlobal('instance')}>
              Store as Global Variable
            </button>}
        </div>
        <strong>Props</strong>
        <DataView
          readOnly={true}
          path={['props']}
          inspect={this.props.inspect}
          makeGlobal={this.props.makeGlobal}
          key={this.props.id + '-props'}
          data={this.props.node.get('props')}
        />
        {state &&
          <div>
            <strong>State</strong>
            <DataView
              data={state}
              path={['state']}
              inspect={this.props.inspect}
              makeGlobal={this.props.makeGlobal}
              key={this.props.id + '-state'}
            />
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
      id: store.selected,
      node: store.selected ? store.get(store.selected) : null,
      setState(path, val) {
        store.setState(store.selected, path, val);
      },
      makeGlobal(path) {
        store.makeGlobal(store.selected, path);
      },
      inspect: store.inspect.bind(store, store.selected),
    };
  }
}, PropState);

var styles = {
  container: {
    padding: 10,
    fontSize: '12px',
    fontFamily: 'monospace',
    width: 300,
  },
  header: {
    display: 'flex',
  },
  headerName: {
    flex: 1,
    fontSize: 16,
    color: 'rgb(184, 0, 161)',
  },
  globalButton: {
    cursor: 'pointer',
  },
};

module.exports = WrappedPropState;
