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

  module: {
    loaders: [{
      test: /\.jsx?$/,
      loader:  'babel-loader?stage=0',
      exclude: [
        'node_modules',
      ],
    }],
  },
};
