/** @flow **/

var React = require('react');
var SearchPane = require('./search-pane');
var PropState = require('./prop-state');
var SplitPane = require('./split-pane');
var ContextMenu = require('./context-menu');

class Container extends React.Component {
  render(): ReactElement {
    return (
      <div style={styles.container}>
        <SplitPane
          initialWidth={300}
          left={() => <SearchPane />}
          right={() => <PropState extraPanes={this.props.extraPanes} />}
        />
        <ContextMenu />
      </div>
    );
  }
}

var styles = {
  container: {
    flex: 1,
    display: 'flex',
  },
}

module.exports = Container;
