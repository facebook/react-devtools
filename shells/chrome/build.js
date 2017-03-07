#!/usr/bin/env node
var fs = require('fs');  // file system
var path = require('path');
var webpack = require('webpack');
var webpackConfig = require('./webpack.config');
var webpackBackendConfig = require('./webpack.backend');

function copyFile(source, destination) {
  var readstream = fs.createReadStream(source);
  var writestream = fs.createWriteStream(path.join(destination, source));
  readstream.pipe(writestream);
}

function removeDirectory(dirPath) {
  try {
    var filesToDelete = fs.readdirSync(dirPath);
  } catch (e) {
    return;
  }
  if (filesToDelete.length > 0) {
    for (var i = 0; i < filesToDelete.length; i++) {
      var filePath = dirPath + '/' + filesToDelete[i];
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      } else {
        removeDirectory(filePath);
      }
    }
  }
  fs.rmdirSync(dirPath);
}

function createDirectories(paths) {
  paths.forEach(function(p) {
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p);
    }
  });
}

function main() {
  var paths = {
    build: 'build',
    dest: 'build/react-devtools-chrome',
    destBuild: 'build/react-devtools-chrome/build',
    destIcons: 'build/react-devtools-chrome/icons',
  };

  var files = [
    'build/backend.js',
    'build/background.js',
    'build/contentScript.js',
    'build/inject.js',
    'build/main.js',
    'build/panel.js',
    'icons/icon48.png',
    'icons/icon128.png',
    'main.html',
    'manifest.json',
    'panel.html',
  ];

  process.env.NODE_ENV = JSON.stringify('production');

  console.log('bundling extension...');
  
  var bundleFiles = new Promise(function(resolve, reject) {
    webpack([webpackConfig, webpackBackendConfig], function(error, stats) {
      if (!error) {
        resolve(stats);
      } else {
        reject(error);
      }
    });
  });

  bundleFiles
    .then(function() {
      // check if directory exists
      if (fs.existsSync(paths.dest)) {
        // clean it up
        removeDirectory(paths.dest);
      }
      
      createDirectories([
        paths.build,
        paths.dest,
        paths.destBuild,
        paths.destIcons,
      ]);
      
      files.forEach(function(file) {
        copyFile(file, paths.dest);
      });
      console.log('extension bundled at \'build/react-devtools-chrome\'')
    })
    .catch(function(error) {
      console.log('failed to bundle extension');
    });
}

main();
