#!/usr/bin/env node
var electron = require('electron')
var spawn = require('cross-spawn');

var result = spawn.sync(
  electron,
  [require.resolve('./app')],
  {stdio: 'inherit'}
);
process.exit(result.status);
