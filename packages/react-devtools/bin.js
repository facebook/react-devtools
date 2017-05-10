#!/usr/bin/env node
var electron = require('electron');
var spawn = require('cross-spawn');
var argv = process.argv.slice(2);

var result = spawn.sync(
  electron,
  [require.resolve('./app')].concat(argv),
  {stdio: 'inherit'}
);
process.exit(result.status);
