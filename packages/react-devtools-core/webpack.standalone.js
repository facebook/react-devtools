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

const {readFileSync} = require('fs');
const {resolve} = require('path');
const webpack = require('webpack');

const __DEV__ = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: __DEV__ ? 'development' : 'production',
  devtool: __DEV__ ? 'source-map' : false,
  target: 'electron-main',
  externals: ['ws'],
  entry: {
    standalone: './src/standalone.js',
  },
  output: {
    path: __dirname + '/build', // eslint-disable-line no-path-concat
    filename: '[name].js',
    library: '[name]',
    libraryTarget: 'commonjs2',
  },
  node: {
    // Don't replace __dirname!
    // This would break the standalone DevTools ability to load the backend.
    // see https://github.com/facebook/react-devtools/issues/1269
    __dirname: false,
  },
  plugins: __DEV__ ? [] : [
    // Ensure we get production React
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: JSON.parse(readFileSync(resolve(__dirname, '../../.babelrc'))),
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              // WARNING It's important that we disable CSS source maps for production builds.
              // This causes style-loader to insert styles via a <style> tag rather than URL.createObjectURL,
              // which in turn avoids a nasty Electron/Chromium bug that breaks DevTools in Nuclide.
              // (Calls to URL.createObjectURL seem to crash the webview process.)
              sourceMap: __DEV__,
              modules: true,
              localIdentName: '[local]___[hash:base64:5]',
            },
          },
        ],
      },
    ],
  },
};
