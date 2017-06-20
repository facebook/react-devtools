#!/bin/bash
set -ex

../../node_modules/.bin/webpack --config webpack.config.js $@
