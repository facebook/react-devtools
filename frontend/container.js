/** @flow **/

var React = require('react');
var TreeView = require('./tree-view');
var PropState = require('./prop-state');

class Container extends React.Component {
  render(): ReactElement {
    return (
      <div style={styles.container}>
        <div style={styles.leftPane}>
          <TreeView />
        </div>
        <div style={styles.rightPane}>
          <PropState />
        </div>
      </div>
    );
  }
}

var styles = {
  container: {
    display: 'flex',
    fontFamily: 'sans-serif',
    flex: 1,
  },

  rightPane: {
    display: 'flex',
  },

  leftPane: {
    display: 'flex',
    flex: 1,
  },
}

module.exports = Container;
