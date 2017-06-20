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

  console.log(chalk.green('\nThe Firefox extension has been built!'));
  console.log(chalk.green('You can test it by following the steps below:'));
  console.log(chalk.gray('\n# Go to the unpacked directory:'));
  console.log(`cd ${unpackedPath}`);
  console.log(chalk.gray('\n# And launch Firefox with the extension enabled:'));
  console.log('web-ext run');
  console.log(chalk.gray('\n# You can also test against upcoming Firefox releases.'));
  console.log(chalk.gray('# First download a release from https://www.mozilla.org/en-US/firefox/channel/desktop/'));
  console.log(chalk.gray('# And then tell web-ext which release to use (eg nigthly, beta):'));
  console.log('web-ext run --firefox=beta');
  console.log(chalk.gray('\n# You can test against older versions too:'));
  console.log('web-ext run --firefox=/Applications/Firefox52.app/Contents/MacOS/firefox-bin');
};

main();
