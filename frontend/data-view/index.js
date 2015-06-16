
var React = require('react');
var Simple = require('./simple');

class DataView extends React.Component {
  render() {
    if (!this.props.data) {
      return <span>No data</span>;
    }
    var names = Object.keys(this.props.data);
    var path = this.props.path || [];
    return (
      <ul style={styles.container}>
        {names.map((name, i) => (
          <DataItem
            name={name}
            path={path}
            value={this.props.data[name]}
          />
        ))}
      </ul>
    );
  }
}

class DataItem extends React.Component {
  constructor(props) {
    super(props)
    this.state = {open: false};
  }

  toggleOpen() {
    this.setState({
      open: !this.state.open,
    });
  }

  render() {
    var data = this.props.value;
    var otype = typeof data;

    var complex = true;
    var preview;
    if (otype === 'number' || otype === 'string' || data === null || data === undefined || otype === 'boolean') {
      preview = <Simple data={data} />;
      complex = false;
    } else {
      preview = 'Complex data';
    }

    var opener = null;
    if (complex) {
      opener = (
        <div
          onClick={this.toggleOpen.bind(this)}
          style={styles.opener}>
          {this.state.open ? <span>&#9660;</span> : <span>&#9654;</span>}
        </div>
      );
    }

    var children = null;
    if (complex && this.state.open) {
      // TODO path
      children = (
        <div style={styles.children}>
          <DataView data={this.props.value} />
        </div>
      );
    }

    return (
      <li style={styles.item}>
        <div style={styles.head}>
          {opener}
          <div style={styles.name}>
            {this.props.name}
          </div>
          <div style={styles.preview}>
            {preview}
          </div>
        </div>
        {children}
      </li>
    );
  }
}

var styles = {
  container: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    marginLeft: 20,
  },

  children: {
  },

  preview: {
    display: 'flex',
    flex: 1,
  },

  opener: {
    fontSize: 10,
    cursor: 'pointer',
    position: 'absolute',
    right: '100%',
  },

  head: {
    display: 'flex',
    position: 'relative',
  },

  name: {
    color: '#666',
    margin: '2px 5px',
  },

  value: {
  },
};

module.exports = DataView;
