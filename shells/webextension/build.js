/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

'use strict';

const AdmZip = require('adm-zip');
const chalk = require('chalk');
const {exec} = require('child-process-promise');
const {dots} = require('cli-spinners');
const {copy, ensureDir, move, remove} = require('fs-extra');
const logUpdate = require('log-update');
const {join, relative} = require('path');

// These files are copied along with Webpack-bundled files
// to produce the final web extension
const STATIC_FILES = [
  'icons',
  'popups',
  'main.html',
  'panel.html',
];

const relativePath = path => relative(process.cwd(), path);

const logPromise = async (promise, text, completedLabel = '') => {
  const {frames, interval} = dots;

  let index = 0;

  const id = setInterval(() => {
    index = ++index % frames.length;
    logUpdate(`${chalk.yellow(frames[index])} ${text} ${chalk.gray('- this may take a few seconds')}`);
  }, interval);

  const returnValue = await promise;

  clearInterval(id);

  logUpdate(`${chalk.green('✓')} ${text} ${chalk.gray(completedLabel)}`);
  logUpdate.done();

  return returnValue;
};

const preProcess = async (destinationPath, tempPath) => {
  await remove(destinationPath); // Clean up from previously completed builds
  await remove(tempPath); // Clean up from any previously failed builds
  await ensureDir(tempPath); // Create temp dir for this new build
};

const build = async(tempPath, manifestPath) => {
  const binPath = join(tempPath, 'bin');
  const zipPath = join(tempPath, 'zip');

  const webpackPath = join(__dirname, '..', '..', 'node_modules', '.bin', 'webpack');
  await exec(
    `${webpackPath} --config webpack.config.js --output-path ${binPath}`,
    {cwd: __dirname, env: Object.assign({}, process.env, {NODE_ENV: 'production'})}
  );
  await exec(
    `${webpackPath} --config webpack.backend.js --output-path ${binPath}`,
     {cwd: __dirname, env: Object.assign({}, process.env, {NODE_ENV: 'production'})}
  );

  // Make temp dir
  await ensureDir(zipPath);

  // Copy unbuilt source files to zip dir to be packaged:
  await copy(binPath, join(zipPath, 'build'));
  await copy(manifestPath, join(zipPath, 'manifest.json'));
  await Promise.all(
    STATIC_FILES.map(file => copy(join(__dirname, file), join(zipPath, file)))
  );

  // Pack the extension
  const zip = new AdmZip();
  zip.addLocalFolder(zipPath);
  zip.writeZip(join(tempPath, 'packed.zip'));
};

const postProcess = async (tempPath, destinationPath) => {
  const unpackedSourcePath = join(tempPath, 'zip');
  const packedSourcePath = join(tempPath, 'packed.zip');
  const packedDestPath = join(destinationPath, 'packed.zip');
  const unpackedDestPath = join(destinationPath, 'unpacked');

  await move(unpackedSourcePath, unpackedDestPath); // Copy built files to destination
  await move(packedSourcePath, packedDestPath); // Copy built files to destination
  await remove(tempPath); // Clean up temp directory and files
};

const main = async (buildId, manifestPath, destinationPath) => {
  try {
    const tempPath = join(__dirname, 'build', buildId);

    await logPromise(
      preProcess(destinationPath, tempPath),
      'Preparing build'
    );

    await logPromise(
      build(tempPath, manifestPath),
      'Building extension',
      `- temporary files in ${relativePath(tempPath)}`
    );

    const builtUnpackedPath = join(destinationPath, 'unpacked');

    await logPromise(
      postProcess(tempPath, destinationPath),
      'Unpacking extension',
      `- artifacts in ${relativePath(destinationPath)}`
    );

    return builtUnpackedPath;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  return null;
};

module.exports = main;
