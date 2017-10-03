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

module.exports = {
  devtool: false, //'cheap-module-eval-source-map',
  entry: {
    application: './application.js',
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
};
