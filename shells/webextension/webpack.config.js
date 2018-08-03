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
  devtool: __DEV__ ? '#cheap-module-eval-source-map' : false,
  entry: {
    main: './src/main.js',
    background: './src/background.js',
    inject: './src/GlobalHook.js',
    contentScript: './src/contentScript.js',
    panel: './src/panel.js',
  },
  output: {
    path: __dirname + '/build',
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
