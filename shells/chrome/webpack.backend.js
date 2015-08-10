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
var fs = require('fs');

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

  plugins: [new webpack.ProvidePlugin({
    'Object.create': __dirname + '/helpers/object-create.js',
    Map: __dirname + '/helpers/map.js',
    WeakMap: __dirname + '/helpers/weak-map.js',
    Set: __dirname + '/helpers/set.js',
  })],
};



