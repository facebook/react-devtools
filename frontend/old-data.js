
class DataView extends React.Component {
  constructor() {
    super()
    this.state = {
      collapsed: true,
    }
  }

  _renderChildren() {
    if (this.state.collapsed && !this.props.root) {
      return null;
    }
    var data = this.props.data;
    if (!data) {
      return 'null';
    }
    var names = Object.keys(data);
    return (
      <ul style={styles.children}>
        {names.map(name => (
          <li key={name} style={styles.child}>
            {this._renderChild(name)}
          </li>
        ))}
      </ul>
    );
  }

  _renderChild(name) {
    var path = (this.props.path || []).concat([name]);
    var data = this.props.data[name];
    if ('object' === typeof data) {
      return <DataView path={path} data={data[name]} />
    }
  }

  render() {
    return (
      <div style={styles.container}>
        <div style={styles.head}>
          <span style={styles.collapse}>
          </span>
          <span style={styles.name}>
          </span>
        </div>
        {this._renderChildren()}
      </div>
    );
  }
}

