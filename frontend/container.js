/** @flow **/

var React = require('react');
var SearchPane = require('./search-pane');
var PropState = require('./prop-state');
var SplitPane = require('./split-pane');
var ContextMenu = require('./context-menu');
var consts = require('../backend/consts');

class Container extends React.Component {
  render(): ReactElement {
    var defaultItems = {
      tree: (id, node, store) => {
        var items = [];
        if (store.capabilities.scroll) {
          items.push({
            title: 'Scroll to node',
            action: () => store.scrollToNode(id),
          });
        }
        return items;
      },
      attr: (id, node, val, path, name, store) => {
        var items = [{
          title: 'Store as global variable',
          action: () => store.makeGlobal(id, path),
        }];
        if (val && val[consts.type] === 'function') {
          items.push({
            title: 'Call function',
            action: () => store.callFunction(id, path),
          });
        }
      },
    };
    return (
      <div style={styles.container}>
        <SplitPane
          initialWidth={300}
          left={() => <SearchPane reload={this.props.reload} />}
          right={() => <PropState extraPanes={this.props.extraPanes} />}
        />
        <ContextMenu itemSources={[defaultItems, this.props.menuItems]} />
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
