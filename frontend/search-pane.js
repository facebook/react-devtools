
var React = require('react');
var Node = require('./node');
var TreeView = require('./tree-view');

var decorate = require('./decorate');

class SearchPane extends React.Component {
  onKey(key) {
    if (key === 'Enter') {
      this.input.getDOMNode().blur();
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
      if (document.activeElement === this.input.getDOMNode()) {
        return;
      }
      this.input.getDOMNode().focus();
      e.preventDefault();
    }
    // it has to be here to prevevnt devtool console from flipping
    if (e.keyCode === 27) { // escape
      if (document.activeElement !== this.input.getDOMNode()) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      this.cancel();
    }
  }

  cancel() {
    this.props.onChangeSearch('');
    setTimeout(() => {
      this.input.getDOMNode().blur();
    }, 100)
  }

  render() {
    return (
      <div style={styles.container}>
        <TreeView />
        <div style={styles.searchBox}>
          <input
            style={styles.input}
            ref={i => this.input = i}
            value={this.props.searchText}
            onKeyDown={e => this.onKey(e.key)}
            onChange={e => this.props.onChangeSearch(e.target.value)}
          />
          {this.props.searchText && <div onClick={this.cancel.bind(this)} style={styles.cancelButton}>
            &times;
          </div>}
        </div>
      </div>
    );
  }
}

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
    boxShadow: '0 0 3px #ccc',
    borderRadius: '10px',
    height: '17px',
    position: 'absolute',
    cursor: 'pointer',
    right: '2px',
    top: '4px',
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

module.exports = Wrapped;
