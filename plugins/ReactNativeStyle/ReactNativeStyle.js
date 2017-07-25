/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

var React = require('react');
var StyleEdit = require('./StyleEdit');
var BoxInspector = require('./BoxInspector');
var ComputedProperties = require('./ComputedProperties');
var DetailPaneSection = require('../../frontend/detail_pane/DetailPaneSection');
var {sansSerif} = require('../../frontend/Themes/Fonts');
import type {Theme} from '../../frontend/types';

function shallowClone(obj) {
  var nobj = {};
  for (var n in obj) {
    nobj[n] = obj[n];
  }
  return nobj;
}

function getDefaultParentStyle(props) {
  var willFetchParentStyle = props.parentId && props.supportsMeasure;
  return (
    willFetchParentStyle
    ? null // We don't know the parent's style yet. It is or will be loading.
    : {} // We already know we should treat the parent's style as empty.
  );
}

type Props = {
  // TODO: typecheck bridge interface
  bridge: any;
  id: any;
  parentId: any;
  supportsMeasure: boolean;
};

type DefaultProps = {};

type State = {
  style: ?Object;
  parentStyle: ?Object;
  measuredLayout: ?Object;
};

type StyleResult = {
  style: Object;
  measuredLayout: ?Object;
};

class NativeStyler extends React.Component {
  props: Props;
  defaultProps: DefaultProps;
  state: State;
  _styleGet: (result: StyleResult) => void;

  constructor(props: Object) {
    super(props);
    this.state = {
      style: null,
      measuredLayout: null,
      parentStyle: getDefaultParentStyle(props)
    };
  }

  componentWillMount() {
    this._styleGet = this._styleGet.bind(this);
    if (this.props.supportsMeasure) {
      this.props.bridge.on('rn-style:measure', this._styleGet);
      this.props.bridge.send('rn-style:measure', this.props.id);
      if (this.props.parentId) {
        this.props.bridge.call('rn-style:get', this.props.parentId, parentStyle => {
          this.setState({parentStyle: parentStyle || {}});
        });
      }
    } else {
      this.props.bridge.call('rn-style:get', this.props.id, style => {
        this.setState({style});
      });
    }
  }

  componentWillUnmount() {
    if (this.props.supportsMeasure) {
      this.props.bridge.off('rn-style:measure', this._styleGet);
    }
  }

  componentWillReceiveProps(nextProps: Object) {
    if (nextProps.id === this.props.id) {
      return;
    }
    this.setState({
      style: null,
      parentStyle: getDefaultParentStyle(nextProps)
    });
    this.props.bridge.send('rn-style:get', nextProps.id);

    if (this.props.supportsMeasure) {
      this.props.bridge.send('rn-style:measure', nextProps.id);
      if (nextProps.parentId) {
        this.props.bridge.call('rn-style:get', nextProps.parentId, parentStyle => {
          this.setState({parentStyle: parentStyle || {}});
        });
      }
    } else {
      this.props.bridge.call('rn-style:get', nextProps.id, style => {
        this.setState({style});
      });
    }
  }

  _styleGet(result: StyleResult) {
    var {style, measuredLayout} = result;
    this.setState({
      style: style || {},
      measuredLayout
    });
  }

  _handleStyleChange(attr: string, val: string | number) {
    if (this.state.style) {
      this.state.style[attr] = val;
    }
    this.props.bridge.send('rn-style:set', {id: this.props.id, attr, val});
    this.setState({style: this.state.style});
  }

  _handleStyleRename(oldName: string, newName: string, val: string | number) {
    var style = shallowClone(this.state.style);
    delete style[oldName];
    style[newName] = val;
    this.props.bridge.send('rn-style:rename', {id: this.props.id, oldName, newName, val});
    this.setState({style});
  }

  _renderLayoutSection(loading: boolean) {
    if (!this.props.supportsMeasure) {
      return null;
    }

    var body;
    if (loading) {
      body = <em>loading</em>;
    } else if (this.state.measuredLayout) {
      // These shouldn't be null in this branch but we
      // need to ensure they aren't null so the program type checks.
      var style = this.state.style || {};
      var parentStyle = this.state.parentStyle || {};

      body = [
        <BoxInspector {...this.state.measuredLayout} />,
        <ComputedProperties
          style={style}
          parentStyle={parentStyle}
          width={this.state.measuredLayout.width}
          height={this.state.measuredLayout.height}
        />
      ];
    } else {
      body = (
        <div style={emptyStyle(this.context.theme)}>
          Layout unavailable
        </div>
      );
    }

    return (
      <DetailPaneSection
        title="Layout"
        key={this.props.id + '-layout'}
      >
        {body}
      </DetailPaneSection>
    );
  }

  _renderStyleEditSection(loading: boolean) {
    var body;
    if (loading) {
      body = <em>loading</em>;
    } else if (!this.state.style || Object.keys(this.state.style).length === 0) {
      body = (
        <div style={emptyStyle(this.context.theme)}>
          No style
        </div>
      );
    } else {
      body = (
        <StyleEdit
          style={this.state.style}
          onRename={this._handleStyleRename.bind(this)}
          onChange={this._handleStyleChange.bind(this)}
        />
      );
    }

    return (
      <DetailPaneSection
        title="React Native Style Editor"
        key={this.props.id + '-style-editor'}
      >
        {body}
      </DetailPaneSection>
    );
  }

  render() {
    var loading = !this.state.style || !this.state.parentStyle;
    return (
      <div style={styles.container}>
        {this._renderLayoutSection(loading)}
        {this._renderStyleEditSection(loading)}
      </div>
    );
  }
}

NativeStyler.contextTypes = {
  theme: React.PropTypes.object.isRequired,
};

const emptyStyle = (theme: Theme) => ({
  marginLeft: '0.75rem',
  padding: '0 5px',
  color: theme.base04,
  fontFamily: sansSerif.family,
  fontSize: sansSerif.sizes.normal,
  fontStyle: 'italic',
});

var styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
};

module.exports = NativeStyler;
