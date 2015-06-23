
var React = require('react');
var assign = require('object-assign');

class SplitPane extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      width: props.initialWidth,
    };
    this._onMove = this.onMove.bind(this);
    this._onUp = this.onUp.bind(this);
  }

  _startDragging(evt) {
    evt.preventDefault();
    window.addEventListener('mousemove', this._onMove);
    window.addEventListener('mouseup', this._onUp);
    this.setState({moving: true});
  }

  onMove(evt) {
    evt.preventDefault();
    var node = React.findDOMNode(this);
    this.setState({
      width: (node.offsetLeft + node.offsetWidth) - evt.pageX
    });
  }

  onUp(evt) {
    evt.preventDefault();
    window.removeEventListener('mousemove', this._onMove);
    window.removeEventListener('mouseup', this._onUp);
    this.setState({moving: false});
  }

  render() {
    var dragStyle = styles.dragger;
    if (this.state.moving) {
      dragStyle = assign({}, dragStyle, styles.draggerMoving);
    }
    var rightStyle = assign({}, styles.rightPane, {
      width: this.state.width
    });
    return <div style={styles.container}>
      <div style={styles.leftPane}>
        {this.props.left()}
      </div>
      <div style={dragStyle} onMouseDown={this._startDragging.bind(this)}/>
      <div style={rightStyle}>
        {this.props.right()}
      </div>
    </div>
  }
}

var styles = {
  container: {
    display: 'flex',
    fontFamily: 'sans-serif',
    flex: 1,
  },

  dragger: {
    cursor: 'ew-resize',
    borderWidth: '0 5px',
    backgroundColor: '#ccc',
    width: 1,
    borderStyle: 'solid',
    borderColor: 'white',
  },

  draggerMoving: {
    backgroundColor: '#aaf',
  },

  rightPane: {
    display: 'flex',
  },

  leftPane: {
    display: 'flex',
    flex: 1,
  },
}

module.exports = SplitPane;
