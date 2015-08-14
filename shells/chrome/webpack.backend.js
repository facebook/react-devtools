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

module.exports = {
  devtool: 'cheap-module-eval-source-map',
  entry: {
    backend: './src/backend.js',
  },
  output: {
    path: __dirname + '/build', // eslint-disable-line no-path-concat
    filename: '[name].js',
  },

  module: {
    loaders: [{
      test: /\.jsx?$/,
      loader:  'babel-loader?stage=0',
      exclude: [
        'node_modules',
        './helpers.js',
      ],
    }]
  },

  plugins: [new webpack.DefinePlugin({
    'Object.create': 'window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeObjectCreate',
    WeakMap: 'window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeWeakMap',
    Map: 'window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeMap',
    Set: 'window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeSet',
  })],
};



