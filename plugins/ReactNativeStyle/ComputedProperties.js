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
var {monospace} = require('../../frontend/Themes/Fonts');
import type {Theme} from '../../frontend/types';

type CssValue = {
  value: string | number,
  source: string
};

function resolveAlignSelf(parentStyle: Object, style: Object): CssValue {
  if (style.alignSelf != null) {
    return { value: style.alignSelf, source: 'explicit' };
  } else if (parentStyle.alignItems != null) {
    return { value: parentStyle.alignItems, source: 'alignItems' };
  } else {
    return { value: 'stretch', source: 'default' };
  }
}

function resolveFlexBasis(style: Object): CssValue {
  if (style.flexBasis != null) {
    return { value: style.flexBasis, source: 'explicit' };
  } else if (style.flex != null) {
    return {
      value: style.flex > 0 ? 0 : 'auto',
      source: 'flex',
    };
  } else {
    return { value: 'auto', source: 'default' };
  }
}

function resolveFlexGrow(style: Object): CssValue {
  if (style.flexGrow != null) {
    return { value: style.flexGrow, source: 'explicit' };
  } else if (style.flex != null) {
    return {
      value: style.flex > 0 ? style.flex : 0,
      source: 'flex',
    };
  } else {
    return { value: 0, source: 'default' };
  }
}

function resolveFlexShrink(style: Object): CssValue {
  if (style.flexShrink != null) {
    return { value: style.flexShrink, source: 'explicit' };
  } else if (style.flex != null) {
    return {
      value: style.flex < 0 ? -style.flex : 0,
      source: 'flex',
    };
  } else {
    return { value: 0, source: 'default' };
  }
}

function resolveWidth(style: Object): CssValue {
  if (style.width != null) {
    return { value: style.width, source: 'explicit' };
  } else {
    return { value: 'undefined', source: 'default' };
  }
}

function resolveHeight(style: Object): CssValue {
  if (style.height != null) {
    return { value: style.height, source: 'explicit' };
  } else {
    return { value: 'undefined', source: 'default' };
  }
}

type Props = {
  style: Object,
  parentStyle: Object,
  width: number,
  height: number,
};

type DefaultProps = {};

type State = {};

class ComputedProperties extends React.Component {
  props: Props;
  defaultProps: DefaultProps;
  state: State;

  constructor(props: Object) {
    super(props);
  }

  _renderField(label: string, value: CssValue): React$Element {
    var sourceDescription = (
      value.source === 'explicit' ? 'Property set explicity' :
      value.source === 'default' ? 'Default value' :
      `Value inherited from '${value.source}' property`
    );
    return (
      <li style={listItemStyle(value.source === 'default')}>
        <div style={textStyle(this.context.theme, true)}>
          {label}
        </div>
        <span style={styles.colon}>:</span>
        <div style={textStyle(this.context.theme, false)} title={sourceDescription}>
          {value.value}
        </div>
      </li>
    );
  }

  _renderFlexAxisProperties(): React$Element[] {
    var style = this.props.style;
    return [
      this._renderField('flexBasis', resolveFlexBasis(style)),
      this._renderField('flexGrow', resolveFlexGrow(style)),
      this._renderField('flexShrink', resolveFlexShrink(style)),
    ];
  }

  _renderCrossAxisProperties() {
    var style = this.props.style;
    var parentStyle = this.props.parentStyle;
    return (
      this._renderField('alignSelf', resolveAlignSelf(parentStyle, style))
    );
  }

  render() {
    var theme = this.context.theme;
    var parentFlexDirection = this.props.parentStyle.flexDirection || 'column';
    var isFlexAxisColumn = parentFlexDirection === 'column' || parentFlexDirection === 'column-reverse';
    return (
      <div style={styles.container}>
        <div style={styles.dimensionGroup}>
          <span style={headerStyle(theme)}>Width</span>
          <span style={dimenTextStyle(theme)}>{this.props.width}</span>
          <ul style={styles.list}>
            {isFlexAxisColumn ? this._renderCrossAxisProperties() : this._renderFlexAxisProperties()}
            {this._renderField('width', resolveWidth(this.props.style))}
          </ul>
        </div>

        <div style={styles.dimensionGroup}>
          <span style={headerStyle(theme)}>Height</span>
          <span style={dimenTextStyle(theme)}>{this.props.height}</span>
          <ul style={styles.list}>
            {isFlexAxisColumn ? this._renderFlexAxisProperties() : this._renderCrossAxisProperties()}
            {this._renderField('height', resolveHeight(this.props.style))}
          </ul>
        </div>
      </div>
    );
  }
}

ComputedProperties.contextTypes = {
  theme: React.PropTypes.object.isRequired,
};

const headerStyle = (theme: Theme) => ({
  color: theme.base04,
});

const dimenTextStyle = (theme: Theme) => ({
  color: theme.special02,
  marginLeft: 6,
});

const listItemStyle = (isDisabled: boolean) => ({
  opacity: isDisabled ? 0.5 : 1.0,
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  cursor: 'default',
});

const textStyle = (theme: Theme, isLabel: boolean) => ({
  color: isLabel ? theme.special03 : theme.base05,
  marginLeft: isLabel ? 12 : 6,
  border: 'none',
  padding: '1px 2px',
  boxSizing: 'content-box',
  display: 'inline-block',
  fontFamily: monospace.family,
  fontSize: monospace.sizes.normal,
});

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  dimensionGroup: {
    margin: '5px 0px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    cursor: 'text',
  },
  colon: {
    margin: '-3px',
  },
};

module.exports = ComputedProperties;
