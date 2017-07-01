/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var app = require('electron').app;  // Module to control application life.
var BrowserWindow = require('electron').BrowserWindow;  // Module to create native browser window.
var path = require('path');

var mainWindow = null;
var argv = require('minimist')(process.argv.slice(2));
var projectRoots = argv._;
var defaultThemeName = argv.theme;

app.on('window-all-closed', function() {
  app.quit();
});

app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600, icon: path.join(__dirname, 'icons/icon128.png')});

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/app.html'); // eslint-disable-line no-path-concat
  mainWindow.webContents.executeJavaScript(
    // We use this so that RN can keep relative JSX __source filenames
    // but "click to open in editor" still works. js1 passes project roots
    // as the argument to DevTools.
    'window.devtools.setProjectRoots(' + JSON.stringify(projectRoots) + ')'
  );

  if (defaultThemeName) {
    mainWindow.webContents.executeJavaScript(
      'window.devtools.setDefaultThemeName(' + JSON.stringify(defaultThemeName) + ')'
    );
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
