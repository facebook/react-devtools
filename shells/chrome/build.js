#!/usr/bin/env node
var fs = require('fs-extra');  // file system
var path = require('path');
var webpack = require('webpack');
var webpackConfig = require('./webpack.config');
var webpackBackendConfig = require('./webpack.backend');
var packageJson = require('../../package.json');
var manifestTemplateJson = require('./manifest.template.json');

main().then(function() {
  console.log('extension is bundled at \'/extension\'');
});

function main() {
  var paths = {
    build: 'build',
    dest: 'extension',
    destBuild: 'extension/build',
    destIcons: 'extension/icons',
  };

  var files = [
    'build',
    'icons',
    'popups',
    'main.html',
    'panel.html',
  ];

  process.env.NODE_ENV = JSON.stringify('production');

  fs.emptyDirSync(paths.dest);

  var generateManifest = generateManifestJson(paths.dest);
  
  var bundleFiles = new Promise(function(resolve, reject) {
    // console.log('bundling it all together...');
    webpack([webpackConfig, webpackBackendConfig], function(error, stats) {
      if (!error) {
        resolve(stats);
      } else {
        reject(error);
      }
    });
  });

  return Promise.all([
    generateManifest,
    bundleFiles,
    fs.ensureDir(paths.destBuild),
    fs.ensureDir(paths.destIcons),
  ])
  .then(function() {  
    return Promise.all(
      files.map(function(file) {
        return fs.copy(file, paths.dest + '/' + file);
      })
    );
  })
  .catch(function(error) {
    console.log('failed to bundle extension', error);
  });
}

function generateManifestJson(destination) {
  // console.log('generating manifest file...');
  const manifest = Object.assign(manifestTemplateJson, {
    'version': packageJson.version,
  });

  const fileToWrite = path.resolve(__dirname, destination, 'manifest.json');
  return fs.writeJson(fileToWrite, manifest);
}
