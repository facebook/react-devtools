/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

'use strict';

const AdmZip = require('adm-zip');
const chalk = require('chalk');
const {exec} = require('child-process-promise');
const {copy, move, remove} = require('fs-extra');
const logUpdate = require('log-update');
const {join} = require('path');

const logPromise = async (promise, primaryLabel, secondaryLabel = '') => {
  logUpdate(`${chalk.bgYellow.black('STARTING')} ${primaryLabel} ${chalk.gray(secondaryLabel)}`);
  await promise;
  logUpdate(`${chalk.bgGreen.black('COMPLETE')} ${primaryLabel} ${chalk.gray(secondaryLabel)}`);
  logUpdate.done();
};

const build = async (manifestPath, destinationPath) => {
  try {
    const buildScriptPath = join(__dirname, 'build_helper.sh');
    const buildScriptOptions = {cwd: __dirname};
    const builtArtifactsPath = join(__dirname, 'build');
    const builtZipPath = join(destinationPath, 'react-devtools-chrome.zip'); // TODO
    const builtUnpackedPath = join(destinationPath, 'unpacked');
    const tempManifest = join(__dirname, 'manifest.json');

    await logPromise(copy(manifestPath, tempManifest), 'Copying manifest');
    await logPromise(remove(destinationPath), 'Cleanup old build');
    await logPromise(exec(buildScriptPath, buildScriptOptions), 'Building extension', '(this may take a few seconds)');
    await logPromise(move(builtArtifactsPath, destinationPath), 'Copying new build');
    await logPromise(remove(tempManifest), 'Cleanup');

    // Unzip built bundle into an unpacked directory for local testing.
    logUpdate(`${chalk.bgYellow.black('STARTING')} Unpacking extension ${chalk.gray(builtZipPath)}`);
    new AdmZip(builtZipPath).extractAllTo(join(destinationPath));
    await move(builtZipPath.replace(/\.zip$/, ''), builtUnpackedPath);
    logUpdate(`${chalk.bgGreen.black('COMPLETE')} Unpacking extension ${chalk.gray(builtUnpackedPath)}`);
    logUpdate.done();

    return builtUnpackedPath;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  return null;
};

module.exports = build;
