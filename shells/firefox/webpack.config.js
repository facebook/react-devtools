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
  // devtool: 'cheap-module-eval-source-map',
  entry: {
    panel: './panel/run.js',
    backend: './src/backend.js',
    contentScript: './src/contentScript.js',
    GlobalHook: './src/GlobalHook.js',
  },
  output: {
    path: __dirname + '/data/build',
    filename: '[name].js',
  },
  plugins: __DEV__ ? [] : [
    // Ensure we get production React
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"',
    }),
    // Remove dead code but keep it readable:
    new webpack.optimize.UglifyJsPlugin({
      mangle: false,
      beautify: true,
    }),
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      loader:  'babel',
      exclude: /node_modules/,
    }],
  },
};
