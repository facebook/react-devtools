
var React = require('react');
var Node = require('./node');
var TreeView = require('./tree-view');

var decorate = require('./decorate');

class SearchPane extends React.Component {
  onKey(key) {
    if (key === 'Escape') {
      this.props.onChangeSearch('');
      setTimeout(() => {
        this.input.getDOMNode().blur();
      }, 100)
    }
    if (key === 'Enter') {
      this.input.getDOMNode().blur();
    }
  }

  componentWillMount() {
    this._key = this.onKeyDown.bind(this);
    window.addEventListener('keydown', this._key);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this._key);
  }

  onKeyDown(e) {
    if (e.keyCode === 191) { // forward slash
      this.input.getDOMNode().focus();
      e.preventDefault();
    }
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
    };
  },
}, SearchPane);

module.exports = Wrapped;
