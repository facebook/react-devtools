#!/bin/bash
set -ex

NODE_ENV=production ../../node_modules/.bin/webpack --config webpack.config.js
mkdir -p data/build
cp ../../node_modules/react/dist/react.min.js data/build
cp ../../node_modules/react-dom/dist/react-dom.min.js data/build

rm -f *.xpi
jpm xpi
