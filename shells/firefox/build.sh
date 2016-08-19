#!/bin/bash
set -ex

NODE_ENV=production ../../node_modules/.bin/webpack --config webpack.config.js
rm *.xpi
jpm xpi
