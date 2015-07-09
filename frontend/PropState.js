/** @flow **/

var React = require('react');
var DataView = require('./data-view/DataView');
var DepGraph = require('./DepGraph/DepGraph');
var decorate = require('./decorate');

class PropState extends React.Component {
  getChildContext() {
    return {
      onChange: (path, val) => {
        this.props.onChange(path, val);
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
    var context = this.props.node.get('context');
    var isCustom = this.props.node.get('nodeType') === 'Custom';
    var propsReadOnly = !this.props.node.get('canUpdate');

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.headerName}>
            &lt;{this.props.node.get('name')}&gt;
          </span>
          {nodeType === 'Custom' &&
            <span style={styles.consoleHint}>($r in the console)</span>}
        </div>
        <div style={styles.section}>
          <strong>Props</strong> {propsReadOnly && <em> read-only</em>}
          <DataView
            path={['props']}
            readOnly={propsReadOnly}
            inspect={this.props.inspect}
            showMenu={this.props.showMenu}
            key={this.props.id + '-props'}
            data={this.props.node.get('props')}
          />
        </div>
        {state &&
          <div style={styles.section}>
            <strong>State</strong>
            <DataView
              data={state}
              path={['state']}
              inspect={this.props.inspect}
              showMenu={this.props.showMenu}
              key={this.props.id + '-state'}
            />
          </div>}
        {context &&
          <div style={styles.section}>
            <strong>Context</strong>
            <DataView
              data={context}
              path={['context']}
              inspect={this.props.inspect}
              showMenu={this.props.showMenu}
              key={this.props.id + '-context'}
            />
          </div>}
        {this.props.extraPanes &&
          this.props.extraPanes.map(fn => fn(this.props.node, this.props.id))}
        <DepGraph />
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
    var node = store.selected ? store.get(store.selected) : null;
    return {
      id: store.selected,
      node,
      onChange(path, val) {
        if (path[0] === 'props') {
          store.setProps(store.selected, path.slice(1), val);
        } else if (path[0] === 'state') {
          store.setState(store.selected, path.slice(1), val);
        } else if (path[0] === 'context') {
          store.setContext(store.selected, path.slice(1), val);
        }
      },
      showMenu(e, val, path, name) {
        store.showContextMenu('attr', e, store.selected, node, val, path, name);
      },
      inspect: store.inspect.bind(store, store.selected),
    };
  }
}, PropState);

var styles = {
  container: {
    padding: 3,
    fontSize: '12px',
    fontFamily: 'monospace',
    overflow: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',

    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    MsUserSelect: 'none',
    userSelect: 'none',
  },
  header: {
  },
  headerName: {
    flex: 1,
    fontSize: 16,
    color: 'rgb(184, 0, 161)',
  },
  section: {
    marginBottom: 10,
  },
  globalButton: {
    cursor: 'pointer',
  },
  consoleHint: {
    float: 'right',
    fontSize: 11,
  },
};

module.exports = WrappedPropState;
