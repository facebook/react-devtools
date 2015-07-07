/* @flow */

var React = require('react');
var Node = require('./node');
var TreeView = require('./tree-view');

var decorate = require('./decorate');

type EventLike = {
  keyCode: number,
  preventDefault: () => void,
  stopPropagation: () => void,
};

class SearchPane extends React.Component {
  input: ReactElement;
  _key: (evt: EventLike) => void;

  onKey(key) {
    if (key === 'Enter') {
      React.findDOMNode(this.input).blur();
      this.props.selectFirstNode();
    }
  }

  componentWillMount() {
    this._key = this.onKeyDown.bind(this);
    window.addEventListener('keydown', this._key, true);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this._key, true);
  }

  onKeyDown(e) {
    if (e.keyCode === 191) { // forward slash
      var node = React.findDOMNode(this.input);
      if (document.activeElement === node) {
        return;
      }
      node.focus();
      e.preventDefault();
    }
    // it has to be here to prevevnt devtool console from flipping
    if (e.keyCode === 27) { // escape
      if (!this.props.searchText) {
        return;
      }
      /*
      if (document.activeElement !== React.findDOMNode(this.input)) {
        return;
      }
      */
      e.stopPropagation();
      e.preventDefault();
      this.cancel();
    }
  }

  cancel() {
    this.props.onChangeSearch('');
    setTimeout(() => {
      React.findDOMNode(this.input).blur();
    }, 100)
  }

  render() {
    return (
      <div style={styles.container}>
        <TreeView reload={this.props.reload} />
        <div style={styles.searchBox}>
          <input
            style={styles.input}
            ref={i => this.input = i}
            value={this.props.searchText}
            onKeyDown={e => this.onKey(e.key)}
            placeholder="Search by Component Name"
            onChange={e => this.props.onChangeSearch(e.target.value)}
          />
          {!!this.props.searchText && <div onClick={this.cancel.bind(this)} style={styles.cancelButton}>
            &times;
          </div>}
        </div>
      </div>
    );
  }
}

var Wrapped = decorate({
  listeners(props) {
    return ['searchText'];
  },
  props(store) {
    return {
      searchText: store.searchText,
      onChangeSearch: text => store.onChangeSearch(text),
      selectFirstNode: store.selectFirstNode.bind(store),
    };
  },
}, SearchPane);

var styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },

  searchBox: {
    display: 'flex',
    flexShrink: 0,
    position: 'relative',
  },

  cancelButton: {
    fontSize: '13px',
    padding: '0 4px',
    borderRadius: '10px',
    height: '17px',
    position: 'absolute',
    cursor: 'pointer',
    right: '2px',
    top: '4px',
    color: 'white',
    backgroundColor: 'rgb(255, 137, 137)',
  },

  input: {
    flex: 1,
    fontSize: '14px',
    padding: '3px 5px',
    border: 'none',
    borderTop: '1px solid #ccc',
    outline: 'none',
  },
}

module.exports = Wrapped;
