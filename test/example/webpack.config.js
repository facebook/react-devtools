/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * A TodoMVC++ app for trying out the inspector
 *
 */
'use strict';

module.exports = {
  devtool: 'cheap-module-eval-source-map',
  entry: {
    target: './target.js',
    sink: './sink.js',
  },
  output: {
    path: __dirname + '/build',
    filename: '[name].js',
  },

  alias: {
    'react-dom': 'react-dom/cjs/react-dom.development.js',
  },

  module: {
    loaders: [{
      test: /\.js$/,
      loader:  'babel',
      exclude: /node_modules/,
    }],
  },
};
