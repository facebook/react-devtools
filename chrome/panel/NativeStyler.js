/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @ xx flow
 * $FLowFixMe flow thinks react component classes have to inherit from
 * React.Component
 */

var React = require('react');

class NativeStyler extends React.Component {
  constructor(props: Object) {
    super(props);
    this.state = {style: null};
  }

  componentWillMount() {
    this.props.bridge.call('rn:getStyle', this.props.id, style => {
      this.setState({style});
    });
  }

  componentWillReceiveProps(nextProps: Object) {
    if (nextProps.id === this.props.id) {
      return;
    }
    this.setState({style: null});
    this.props.bridge.call('rn:getStyle', nextProps.id, style => {
      this.setState({style});
    });
  }

  _handleStyleChange(attr: string, val: string | number) {
    this.state.style[attr] = val;
    this.props.bridge.send('rn:setStyle', {id: this.props.id, attr, val});
    this.setState({style: this.state.style});
  }

  render() {
    if (!this.state.style) {
      return <em>loading</em>;
    }
    return (
      <StyleEdit
        style={this.state.style}
        onChange={this._handleStyleChange.bind(this)}
      />
    );
  }
}

class StyleEdit {
  props: {
    style: Object,
    onChange: (attr: string, val: string | number) => void,
  };

  render() {
    var attrs = Object.keys(this.props.style);
    return (
      <ul style={styles.container}>
        {attrs.map(name => (
          <li style={styles.attr}>
            {name}:
            <BlurInput
              value={this.props.style[name]}
              onChange={val => this.props.onChange(name, val)}
            />
          </li>
        ))}
      </ul>
    );
  }
}

class BlurInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {text: '' + this.props.value};
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.setState({text: '' + nextProps.value});
    }
  }

  done() {
    if (this.state.text !== '' + this.props.value) {
      this.props.onChange(this.state.text);
    }
  }

  onKeyDown(e) {
    if (e.key === 'Enter') {
      this.done();
      return;
    } else if (e.key === 'ArrowUp') {
      if (+this.state.text + '' === this.state.text) {
        this.props.onChange(+this.state.text + 1);
      }
    } else if (e.key === 'ArrowDown') {
      if (+this.state.text + '' === this.state.text) {
        this.props.onChange(+this.state.text - 1);
      }
    }
  }

  render() {
    return (
      <input
        value={this.state.text}
        ref={i => this.node = i}
        onChange={e => this.setState({text: e.target.value})}
        onBlur={this.done.bind(this)}
        onKeyDown={e => this.onKeyDown(e)}
      />
    );
  }
}

var styles = {
  container: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  attr: {
    padding: 2,
  },
};

module.exports = NativeStyler;
