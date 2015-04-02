#!/bin/bash

clear;

echo 'build plugin "bananaslug"';

# clean up old files
rm build/*

# copy html files
cp src/htmls/*.html build

# build with webpack
webpack --watch --config webpack.config.js;
