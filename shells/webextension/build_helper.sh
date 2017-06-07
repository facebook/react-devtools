#!/bin/bash
set -ex

SHELL_DIR=$PWD

# GNU mktemp requires the XXXX placeholder
PACKAGE_TMP=$(mktemp -d -t devtools.XXXX)

NODE_ENV=production ../../node_modules/.bin/webpack --config webpack.config.js
NODE_ENV=production ../../node_modules/.bin/webpack --config webpack.backend.js

mkdir "$PACKAGE_TMP/react-devtools-chrome/"
rsync -R \
  build/*.js \
  icons/*.png \
  popups/*.html \
  popups/*.js \
  main.html \
  manifest.json \
  panel.html \
  "$PACKAGE_TMP/react-devtools-chrome/"

pushd "$PACKAGE_TMP"
zip -r react-devtools-chrome.zip react-devtools-chrome/
popd

mv "$PACKAGE_TMP/react-devtools-chrome.zip" build/
rm -rf "$PACKAGE_TMP"
