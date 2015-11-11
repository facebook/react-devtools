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
    v014: ['webpack/hot/dev-server', './attach-0.14.js'],
    v013: ['webpack/hot/dev-server', './attach-0.13.js'],
    v012: ['webpack/hot/dev-server', './attach-0.12.js'],
    v011: ['webpack/hot/dev-server', './attach-0.11.js'],
  },
  output: {
    path: __dirname + '/build',
    filename: '[name].js',
  },

  node: {
    fs: 'empty',
  },

  module: {

    // require
    unknownContextRegExp: /$^/,
    unknownContextCritical: false,

    // require(expr)
    exprContextRegExp: /$^/,
    exprContextCritical: false,

    // require("prefix" + expr + "surfix")
    wrappedContextRegExp: /$^/,
    wrappedContextCritical: false,

    loaders: [{
      test: /\.js$/,
      loader:  'babel',
      exclude: /node_modules/,
    }],
  },
};
