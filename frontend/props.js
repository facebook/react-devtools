
var React = require('react/addons');
var consts = require('../backend/consts');
var valueStyles = require('./value-styles');
var flash = require('./flash');

class Props extends React.Component {
  shouldComponentUpdate(nextProps) {
    if (nextProps === this.props) {
      return false;
    }
    return true;
  }

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
          <PropVal val={props[name]}/>
        </span>
      ));
    });

    if (names.length > 3) {
      items.push('…');
    }
    return <span>{items}</span>
  }
}

class PropVal extends React.Component {
  componentDidUpdate(prevProps) {
    if (this.props.val === prevProps.val) {
      return;
    }
    if (this.props.val && prevProps.val && 'object' === typeof this.props.val && 'object' === typeof prevProps.val) {
      return;
    }
    var node = React.findDOMNode(this);
    flash(node, 'rgba(0,255,0,1)', 'transparent', 1);
  }
  render() {
    return previewProp(this.props.val, this.props.nested);
  }
}

function previewArray(val) {
  var items = {};
  val.slice(0, 3).forEach((item, i) => {
    items['n' + i] = <PropVal val={item} nested={true} />;
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
    items['v' + i] = <PropVal val={val[name]} nested={true} />;
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
    return <span>…</span>;
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
      return <span>{val[consts.name] + '{}'}</span>;
    }
    if (type === 'array') {
      return <span>Array[{val[consts.meta].length}]</span>
    }
  }
  if (nested) {
    return <span>{'{…}'}</span>;
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
