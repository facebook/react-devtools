/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

'use strict';

const chalk = require('chalk');
const {join} = require('path');
const build = require('../webextension/build');

const main = async () => {
  const unpackedPath = await build(
    'firefox',
    join(__dirname, 'manifest.json'),
    join(__dirname, 'build')
  );

  console.log('\nThe Firefox extension has been built!');
  console.log(chalk.gray('\n# Go to the unpacked directory:'));
  console.log(`cd ${unpackedPath}`);
  console.log(chalk.gray('\n# And launch Firefox with the extension enabled:'));
  console.log('web-ext run');
};

main();
