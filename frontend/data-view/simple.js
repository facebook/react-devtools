
var React = require('react');
var assign = require('object-assign');

// using an empty function for ease of debugging;
var BAD_INPUT = function BAD_INPUT(){};

function textToValue(txt) {
  if (!txt.length) {
    return BAD_INPUT;
  }
  try {
    return JSON.parse(txt);
  } catch (e) {
    return BAD_INPUT;
  }
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
      this.onSubmit();
    }
  }

  onSubmit() {
    if (this.state.text === JSON.stringify(this.props.data)) {
      this.setState({
        editing: false,
      });
      return;
    }
    var value = textToValue(this.state.text);
    if (value === BAD_INPUT) {
      this.setState({
        editing: false,
      });
      return;
    }
    this.context.onChange(this.props.path, value);
    this.setState({
      editing: false,
    });
  }

  startEditing() {
    if (this.props.readOnly) {
      return;
    }
    this.setState({
      editing: true,
      text: JSON.stringify(this.props.data),
    });
  }

  render() {
    if (this.state.editing) {
      return (
        <input
          autoFocus={true}
          style={styles.input}
          onChange={e => this.onChange(e)}
          onBlur={() => this.onSubmit()}
          onKeyDown={this.onKeyDown.bind(this)}
          value={this.state.text}
        />
      );
    }

    var style = styles.simple
    if (!this.props.readOnly) {
      style = assign({}, style, styles.editable);
    }
    return (
      <div
        onClick={this.startEditing.bind(this)}
        style={style}>
        {JSON.stringify(this.props.data)}
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

  editable: {
    cursor: 'pointer',
  },

  input: {
    flex: 1,
    minWidth: 50,
    boxSizing: 'border-box',
  },
};

module.exports = Simple;
