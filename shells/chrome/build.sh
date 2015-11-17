#!/bin/bash
set -ex

SHELL_DIR=$PWD
PACKAGE_TMP=$(mktemp -d -t devtools.XXX)

NODE_ENV=production ../../node_modules/.bin/webpack --config webpack.config.js
NODE_ENV=production ../../node_modules/.bin/webpack --config webpack.backend.js

mkdir "$PACKAGE_TMP/react-devtools-chrome/"
rsync -R \
  build/backend.js \
  build/background.js \
  build/contentScript.js \
  build/inject.js \
  build/main.js \
  build/panel.js \
  icons/icon48.png \
  icons/icon128.png \
  main.html \
  manifest.json \
  panel.html \
  "$PACKAGE_TMP/react-devtools-chrome/"

pushd "$PACKAGE_TMP"
zip -r react-devtools-chrome.zip react-devtools-chrome/
popd

mv "$PACKAGE_TMP/react-devtools-chrome.zip" build/
rm -rf "$PACKAGE_TMP"
