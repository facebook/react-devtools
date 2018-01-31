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

export type ClearTimeout = (id: any) => void;
export type SetTimeout = (callback: () => void, delay: number) => any;

const TimerSafe = (Component: any) => {
  class TimerSafeImplementation extends React.Component<any, any> {
    _timeoutIds: {[key: any]: boolean} = {};

    componentWillUnmount() {
      Object.keys(this._timeoutIds).forEach(this._clearTimeout);
    }

    render() {
      return (
        <Component
          {...this.props}
          clearTimeout={this._clearTimeout}
          setTimeout={this._setTimeout}
        />
      );
    }

    _clearTimeout: ClearTimeout = (id) => {
      clearTimeout(id);

      delete this._timeoutIds[id];
    };

    _setTimeout: SetTimeout = (callback, delay) => {
      const id = setTimeout(() => {
        delete this._timeoutIds[id];

        callback();
      }, delay);

      this._timeoutIds[id] = true;

      return id;
    };
  }

  return TimerSafeImplementation;
};

module.exports = TimerSafe;
