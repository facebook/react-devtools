
var React = require('react');
var consts = require('../backend/consts');

class Props extends React.Component {
  render() {
    var props = this.props.props;
    if (!props || 'object' !== typeof props) {
      return <span/>;;
    }

    var names = Object.keys(props).filter(name => {
      if (name[0] === '_') return false;
      if (name === 'children') return false;
      return true;
    });

    var items = [];
    names.slice(0, 3).forEach(name => {
      items.push((
        <span key={name} style={styles.prop}>
          <span style={styles.propName}>{name}</span>
          =
          {previewProp(props[name])}
        </span>
      ));
    });

    if (names.length > 3) {
      items.push('...');
    }
    return <span>{items}</span>
  }
}

function previewProp(val, nested) {
  if ('number' === typeof val) {
    return <span style={styles.previewNumber}>{val}</span>
  }
  if ('string' === typeof val) {
    return <span style={styles.previewString}>"{val}"</span>
  }
  if (Array.isArray(val)) {
    if (nested) {
      return <span style={styles.previewArray}>[({val.length})]</span>;
    }
    var items = [];
    val.slice(0, 3).forEach(item => {
      items.push(previewProp(item, true));
      items.push(',');
    });
    if (val.length > 3) {
      items.push('...');
    } else {
      items.pop();
    }
    return (
      <span style={styles.previewArray}>
        [{items}]
      </span>
    );
  }
  if (!val) {
    return <span style={styles.previewNull}>{'' + val}</span>;
  }
  if ('object' !== typeof val) {
    return '...';
  }
  if (val[consts.type]) {
    var type = val[consts.type];
    if (type === 'function') {
      return (val[consts.name] || 'fn') + '()';
    }
    if (type === 'object') {
      return val[consts.name] + '{}';
    }
  }
  if (nested) {
    return '{...}';
  }
  var names = Object.keys(val);
  var items = [];
  names.slice(0, 3).forEach(name => {
    items.push(<span style={styles.previewAttr}>{name}</span>);
    items.push(': ');
    items.push(previewProp(val[name], true));
    items.push(', ');
  });
  if (names.lenght > 3) {
    items.push('...');
  } else {
    items.pop();
  }
  return (
    <span style={styles.previewObject}>
      {'{'}{items}{'}'}
    </span>
  );
}

var styles = {
  prop: {
    paddingLeft: 5,
  },

  propName: {
    color: 'rgb(165, 103, 42)',
  },

  previewNumber: {
    color: 'blue',
  },

  previewString: {
    color: 'orange',
  },

  previewNull: {
    color: '#999',
  },
}

module.exports = Props;
