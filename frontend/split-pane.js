/** @flow **/

var React = require('react');
var assign = require('object-assign');

import type {DOMNode, DOMEvent} from './types'

class SplitPane extends React.Component {
  _onMove: (evt: DOMEvent) => void;
  _onUp: (evt: DOMEvent) => void;

  constructor(props: Object) {
    super(props);
    this.state = {
      width: props.initialWidth,
    };
    this._onMove = this.onMove.bind(this);
    this._onUp = this.onUp.bind(this);
  }

  _startDragging(evt: DOMEvent) {
    evt.preventDefault();
    window.addEventListener('mousemove', this._onMove);
    window.addEventListener('mouseup', this._onUp);
    this.setState({moving: true});
  }

  onMove(evt: DOMEvent) {
    evt.preventDefault();
    var node = React.findDOMNode(this);
    this.setState({
      width: (node.offsetLeft + node.offsetWidth) - evt.pageX
    });
  }

  onUp(evt: DOMEvent) {
    evt.preventDefault();
    window.removeEventListener('mousemove', this._onMove);
    window.removeEventListener('mouseup', this._onUp);
    this.setState({moving: false});
  }

  render(): ReactElement {
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
