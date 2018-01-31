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

const React = require('react');

type Props = {
};

type State = {
  isHovered: boolean,
  isPressed: boolean,
};

const Hoverable = (Component: any) => {
  class HoverableImplementation extends React.Component<Props, State> {
    props: Props;
    state: State = {
      isHovered: false,
      isPressed: false,
    };

    render() {
      const {isHovered, isPressed} = this.state;

      return (
        <Component
          {...this.props}
          isHovered={isHovered}
          isPressed={isPressed}
          onMouseDown={this._onMouseDown}
          onMouseEnter={this._onMouseEnter}
          onMouseLeave={this._onMouseLeave}
          onMouseUp={this._onMouseUp}
        />
      );
    }

    _onMouseDown: Function = (event: SyntheticMouseEvent<>): void => {
      this.setState({ isPressed: true });
    };

    _onMouseEnter: Function = (event: SyntheticMouseEvent<>): void => {
      this.setState({ isHovered: true });
    };

    _onMouseLeave: Function = (event: SyntheticMouseEvent<>): void => {
      this.setState({ isHovered: false, isPressed: false });
    };

    _onMouseUp: Function = (event: SyntheticMouseEvent<>): void => {
      this.setState({ isPressed: false });
    };
  }

  return HoverableImplementation;
};

module.exports = Hoverable;
