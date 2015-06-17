
var React = require('react');
var assign = require('object-assign');

// using an empty function for ease of debugging;
var BAD_INPUT = function BAD_INPUT(){};

function textToValue(txt) {
  if (!txt.length) {
    return BAD_INPUT;
  }
  if (txt === 'undefined') {
    return undefined;
  }
  try {
    return JSON.parse(txt);
  } catch (e) {
    return BAD_INPUT;
  }
}

function valueToText(value) {
  if (value === undefined) {
    return 'undefined';
  }
  return JSON.stringify(value);
}

class Simple extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      editing: false,
    }
  }

  onChange(e) {
    this.setState({
      text: e.target.value,
    });
  }

  onKeyDown(e) {
    if (e.key === 'Enter') {
      this.onSubmit(true);
    }
    if (e.key === 'Escape') {
      this.setState({
        editing: false
      });
    }
  }

  onSubmit(editing) {
    if (this.state.text === valueToText(this.props.data)) {
      this.setState({
        editing: editing,
      });
      return;
    }
    var value = textToValue(this.state.text);
    if (value === BAD_INPUT) {
      this.setState({
        editing: editing,
      });
      return;
    }
    this.context.onChange(this.props.path, value);
    this.setState({
      editing: editing,
    });
  }

  startEditing() {
    if (this.props.readOnly) {
      return;
    }
    this.setState({
      editing: true,
      text: valueToText(this.props.data),
    });
  }

  selectAll() {
    var node = React.findDOMNode(this.input);
    node.selectionStart = 0
    node.selectionEnd = node.value.length
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.editing && !prevState.editing) {
      this.selectAll();
    }
  }

  render() {
    if (this.state.editing) {
      return (
        <input
          autoFocus={true}
          ref={i => this.input = i}
          style={styles.input}
          onChange={e => this.onChange(e)}
          onBlur={() => this.onSubmit()}
          onKeyDown={this.onKeyDown.bind(this)}
          value={this.state.text}
        />
      );
    }

    var style = styles.simple
    var typeStyle;
    if (!this.props.data) {
      typeStyle = styles.previewNull;
    }
    if ('string' === typeof this.props.data) {
      typeStyle = styles.previewString;
    }
    if ('number' === typeof this.props.data) {
      typeStyle = styles.previewNumber;
    }
    style = assign({}, style, typeStyle);
    if (!this.props.readOnly) {
      assign(style, styles.editable);
    }
    return (
      <div
        onClick={this.startEditing.bind(this)}
        style={style}>
        {valueToText(this.props.data)}
      </div>
    );
  }
}

Simple.contextTypes = {
  onChange: React.PropTypes.func.isRequired,
}

var styles = {
  simple: {
    display: 'flex',
    flex: 1,
  },

  previewNumber: {
    color: 'blue',
  },

  previewString: {
    color: 'red',
  },

  previewNull: {
    color: '#999',
  },

  editable: {
    cursor: 'pointer',
  },

  input: {
    flex: 1,
    minWidth: 50,
    boxSizing: 'border-box',
    border: 'none',
    padding: 0,
    outline: 'none',
    boxShadow: '0 0 3px #ccc',
    fontFamily: 'monospace',
    fontSize: 'inherit',
  },
};

module.exports = Simple;
