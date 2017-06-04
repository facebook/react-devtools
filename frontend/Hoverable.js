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
};

const Hoverable = (Component: any) => {
  class HoverableImplementation extends React.Component<void, Props, State> {
    props: Props;
    state: State = {
      isHovered: false,
    };

    render() {
      const {isHovered} = this.state;

      return (
        <Component
          {...this.props}
          isHovered={isHovered}
          onMouseEnter={this._onMouseEnter}
          onMouseLeave={this._onMouseLeave}
        />
      );
    }

    _onMouseEnter: Function = (event: SyntheticEvent): void => {
      this.setState({ isHovered: true });
    };

    _onMouseLeave: Function = (event: SyntheticEvent): void => {
      this.setState({ isHovered: false });
    };
  }

  return HoverableImplementation;
};

module.exports = Hoverable;
