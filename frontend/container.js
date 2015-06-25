/** @flow **/

var React = require('react');
var TreeView = require('./tree-view');
var PropState = require('./prop-state');
var SplitPane = require('./split-pane');

class Container extends React.Component {
  render(): ReactElement {
    return (
      <SplitPane
        initialWidth={300}
        left={() => <TreeView ref={t => window.treeV = t} />}
        right={() => <PropState extraPanes={this.props.extraPanes} />}
      />
    );
  }
}

module.exports = Container;
