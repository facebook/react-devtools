/** @flow **/

var React = require('react');
var assign = require('object-assign');

var decorate = require('./decorate');

class ContextMenu extends React.Component {
  constructor(props) {
    super(props);
    this._clickout = this.onMouseDown.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.config && !prevProps.config) {
      window.addEventListener('mousedown', this._clickout, true);
    } else if (prevProps.config && !this.props.config) {
      window.removeEventListener('mousedown', this._clickout, true);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('mousedown', this._clickout, true);
  }

  onMouseDown(evt) {
    evt.preventDefault();
    this.props.hideContextMenu();
  }

  render() {
    if (!this.props.config) {
      return <div style={styles.hidden} />;
    }

    var config = this.props.config;
    var containerStyle = assign({}, styles.container, {
      top: config.y + 'px',
      left: config.x + 'px',
    });

    return (
      <div style={containerStyle}>
        Hello menu!
      </div>
    );
  }
}

var styles = {
  hidden: {
    display: 'none',
  },

  container: {
    position: 'fixed',
    backgroundColor: 'white',
    boxShadow: '0 3px 5px #ccc',
  },
}

var Wrapped = decorate({
  listeners() {
    return ['contextMenu'];
  },
  props(store, props) {
    return {
      config: store.contextMenu,
      hideContextMenu: () => store.hideContextMenu(),
    };
  }
}, ContextMenu);

module.exports = Wrapped;
