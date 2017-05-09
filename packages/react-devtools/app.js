/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var app = require('electron').app; // Module to control application life.
var BrowserWindow = require('electron').BrowserWindow; // Module to create native browser window.
var path = require('path');
var updateNotifier = require('update-notifier');
var chalk = require('chalk');

var pkg = require('./package.json');

//check an update
var notifier = updateNotifier({
  pkg,
  updateCheckInterval: 0,
});

if (notifier.update) {
  console.log('Update available ' + notifier.update.current + ' => ' + notifier.update.latest);
  console.log(
    'Run ' +
      chalk.styles.cyan.open +
      'npm install -g react-devtools' +
      chalk.styles.cyan.close +
      ' to update'
  );
}

var mainWindow = null;

app.on('window-all-closed', function() {
  app.quit();
});

app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'icons/icon128.png'),
  });

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/app.html'); // eslint-disable-line no-path-concat

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
