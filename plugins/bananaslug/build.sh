#!/bin/bash

clear;

echo 'build plugin "bananaslug"';

# clean up old files
rm build/*

# copy static files
cp images/*.png build
cp images/*.jpg build

# build with webpack
webpack --watch --config webpack.config.js;
