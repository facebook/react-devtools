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

var PropTypes = require('prop-types');
var React = require('react');

type Props = {
  children: () => React.Node,
  store: Object,
};
module.exports = function(name: string): Object {
  class Wrapper extends React.Component<Props> {
    getChildContext() {
      return {[name]: this.props.store};
    }
    render() {
      return this.props.children();
    }
  }
  Wrapper.childContextTypes = {
    [name]: PropTypes.object,
  };
  Wrapper.displayName = 'StoreProvider(' + name + ')';
  return Wrapper;
};
