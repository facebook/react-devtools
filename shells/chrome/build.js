/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

'use strict';

const chalk = require('chalk');
const {join} = require('path');
const build = require('../webextension/build');

const main = async () => {
  const unpackedPath = await build(
    'chrome',
    join(__dirname, 'manifest.json'),
    join(__dirname, 'build')
  );

  console.log('\nThe Chrome extension has been built!');
  console.log(chalk.gray('\n# Open the following URL in Chrome:'));
  console.log('chrome://extensions/');
  console.log(chalk.gray('\n# Click "Load unpacked extension" and browse to:'));
  console.log(unpackedPath);
};

main();
