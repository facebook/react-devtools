#!/usr/bin/env node

const chromeLaunch = require('chrome-launch'); // eslint-disable-line import/no-extraneous-dependencies
const {resolve} = require('path');

const EXTENSION_PATH = resolve('shells/chrome/build/unpacked');
const START_URL = 'http://localhost:3000';

chromeLaunch(START_URL, {
  args: [`--load-extension=${EXTENSION_PATH}`],
});
