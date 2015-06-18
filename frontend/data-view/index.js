
var React = require('react');
var Simple = require('./simple');
var consts = require('../../backend/consts');
var assign = require('object-assign');

class DataView extends React.Component {
  render() {
    var data = this.props.data;
    if (!data) {
      return <div style={styles.missing}>null</div>;
    }
    var names = Object.keys(data);
    var path = this.props.path;
    if (!names.length) {
      return <span style={styles.empty}>Empty object</span>;
    }

    return (
      <ul style={styles.container}>
        {data[consts.proto] &&
          <DataItem
            name={'__proto__'}
            path={path.concat(['__proto__'])}
            key={'__proto__'}
            inspect={this.props.inspect}
            readOnly={this.props.readOnly}
            value={this.props.data[consts.proto]}
          />}

        {names.map((name, i) => (
          <DataItem
            name={name}
            path={path.concat([name])}
            key={name}
            inspect={this.props.inspect}
            readOnly={this.props.readOnly}
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
    this.state = {open: false, loading: false};
  }

  toggleOpen() {
    if (this.state.loading) {
      return;
    }
    if (this.props.value && this.props.value[consts.inspected] === false) {
      this.props.inspect(this.props.path, value => {
        assign(this.props.value, value);
        this.props.value[consts.inspected] = true;
        this.setState({loading: false});
      });
      this.setState({loading: true, open: true});
      return;
    }

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
      preview = (
        <Simple
          readOnly={this.props.readOnly}
          path={this.props.path.concat([this.props.name])}
          data={data}
        />
      );
      complex = false;
    } else {
      if (Array.isArray(data)) {
        preview = 'Array[' + data.length + ']';
      } else if (data[consts.type]) {
        if (data[consts.preview]) {
          preview = data[consts.preview]
        } else {
          preview = data[consts.name]
        }
      } else {
        preview = '{...}';
      }
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
          <DataView
            data={this.props.value}
            path={this.props.path}
            inspect={this.props.inspect}
            readOnly={this.props.readOnly}
          />
        </div>
      );
    }

    return (
      <li style={styles.item}>
        <div style={styles.head}>
          {opener}
          <div style={styles.name}>
            {this.props.name}:
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

  empty: {
    fontSize: 12,
    marginLeft: 20,
    padding: '2px 5px',
    color: '#aaa',
  },

  missing: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 20,
    padding: '2px 5px',
    color: '#888',
  },

  opener: {
    fontSize: 8,
    cursor: 'pointer',
    position: 'absolute',
    right: '100%',
    padding: '5px 0',
  },

  head: {
    display: 'flex',
    position: 'relative',
  },

  name: {
    color: '#666',
    margin: '2px 3px',
  },

  preview: {
    display: 'flex',
    margin: '2px 3px',
    flex: 1,
  },

  value: {
  },
};

module.exports = DataView;
