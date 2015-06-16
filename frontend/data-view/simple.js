
var React = require('react');

class Simple extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      text: JSON.stringify(this.props.data),
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
    this.props.onChange(this.state.text);
    this.setState({
      editing: false,
    });
  }

  startEditing() {
    this.setState({editing: true});
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

    return (
      <div
        onClick={this.startEditing.bind(this)}
        style={styles.simple}>
        {this.state.text}
      </div>
    );
  }
}

var styles = {
  simple: {
    display: 'flex',
    flex: 1,
  },

  input: {
    flex: 1,
    boxSizing: 'border-box',
  },
};

module.exports = Simple;
