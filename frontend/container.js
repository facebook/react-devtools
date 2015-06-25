/** @flow **/

var React = require('react');
var SearchPane = require('./search-pane');
var PropState = require('./prop-state');
var SplitPane = require('./split-pane');

class Container extends React.Component {
  render(): ReactElement {
    return (
      <SplitPane
        initialWidth={300}
        left={() => <SearchPane />}
        right={() => <PropState extraPanes={this.props.extraPanes} />}
      />
    );
  }
}

module.exports = Container;
