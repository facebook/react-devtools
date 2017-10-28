var React = require('react');
var DataView = require('../../frontend/DataView/DataView');
var consts = require('../../agent/consts');
var assign = require('object-assign');


class Wrapper extends React.Component {

  getChildContext() {
    return {
      onChange: (path, val) => {
        var attr = path[1];
        if (path.length > 2) {
          var updatedStyles = Object.assign(
            {},
            this.props.style[attr],
            path.slice(1).reverse().reduce((obj, _attr) => {
              return typeof obj !== 'object' ? { [_attr]: val }: { [_attr]: obj };
            }, val)[attr]
          );
          this.props.onChange(attr, updatedStyles);
        } else {
          this.props.onChange(attr, val);
        }
      },
    };
  }

  render() {

    var style = this.props.style;
    var inspect = (path, cb) => {
      var inspected = path.slice(1).reduce((obj, attr) => {
        return obj ? obj[attr] : null;
      }, style);
      if (inspected) {
        assign(inspected, style[path[1]][path[2]]);
        inspected[consts.inspected] = true;
      }
      cb();

    };

    return (
      <DataView
        path={['rn-styles']}
        readOnly={false}
        inspect={inspect}
        showMenu={() => {}}
        data={this.props.style}
      />
    );
  }
}

Wrapper.childContextTypes = {
  onChange: React.PropTypes.func,
};


module.exports = Wrapper;
