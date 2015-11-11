/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

var webpack = require('webpack');

var __DEV__ = process.env.NODE_ENV !== 'production';

module.exports = {
  devtool: __DEV__ ? 'cheap-module-eval-source-map' : false,
  entry: {
    backend: './src/backend.js',
  },
  output: {
    path: __dirname + '/build',
    filename: '[name].js',
  },

  module: {
    loaders: [{
      test: /\.js$/,
      loader:  'babel',
      exclude: /node_modules/,
    }],
  },

  plugins: [new webpack.DefinePlugin({
    'Object.create': 'window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeObjectCreate',
    WeakMap: 'window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeWeakMap',
    Map: 'window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeMap',
    Set: 'window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeSet',
  })],
};
