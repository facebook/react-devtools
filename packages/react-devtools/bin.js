#!/usr/bin/env node
var electron = require('electron');
var spawn = require('cross-spawn');
var argv = process.argv.slice(2);
var pkg = require('./package.json');
var updateNotifier = require('update-notifier');

// notify if there's an update
updateNotifier({pkg}).notify({defer: false});

var result = spawn.sync(
  electron,
  [require.resolve('./app')].concat(argv),
  {stdio: 'ignore'}
);
process.exit(result.status);
