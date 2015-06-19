
var React = require('react/addons');
var consts = require('../backend/consts');
var valueStyles = require('./value-styles');

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
      items.push('…');
    }
    return <span>{items}</span>
  }
}

function previewArray(val) {
  var items = {};
  val.slice(0, 3).forEach((item, i) => {
    items['n' + i] = previewProp(item, true);
    items['c' + i] = ',';
  });
  if (val.length > 3) {
    items['last'] = '…';
  } else {
    delete items['c' + (val.length - 1)];
  }
  return (
    <span style={valueStyles.array}>
      [{React.addons.createFragment(items)}]
    </span>
  );
}

function previewObject(val) {
  var names = Object.keys(val);
  var items = {};
  names.slice(0, 3).forEach((name, i) => {
    items['k' + i] = <span style={valueStyles.attr}>{name}</span>;
    items['c' + i] = ': ';
    items['v' + i] = previewProp(val[name], true);
    items['m' + i] = ', ';
  });
  if (names.length > 3) {
    items['rest'] = '…';
  } else {
    delete items['m' + (names.length - 1)];
  }
  return (
    <span style={valueStyles.object}>
      {'{'}{React.addons.createFragment(items)}{'}'}
    </span>
  );
}

function previewProp(val, nested) {
  if ('number' === typeof val) {
    return <span style={valueStyles.number}>{val}</span>
  }
  if ('string' === typeof val) {
    if (val.length > 50) {
      val = val.slice(0, 50) + '…';
    }
    return <span style={valueStyles.string}>"{val}"</span>
  }
  if ('boolean' === typeof val) {
    return <span style={valueStyles.bool}>{'' + val}</span>
  }
  if (Array.isArray(val)) {
    if (nested) {
      return <span style={valueStyles.array}>[({val.length})]</span>;
    }
    return previewArray(val);
  }
  if (!val) {
    return <span style={valueStyles.empty}>{'' + val}</span>;
  }
  if ('object' !== typeof val) {
    return '…';
  }
  if (val[consts.type]) {
    var type = val[consts.type];
    if (type === 'function') {
      return (
        <span style={valueStyles.func}>
          {val[consts.name] || 'fn'}()
        </span>
      );
    }
    if (type === 'object') {
      return val[consts.name] + '{}';
    }
  }
  if (nested) {
    return '{…}';
  }
  return previewObject(val);
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
