#!/usr/bin/env node

/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

'use strict';

const {exec} = require('child-process-promise');
const {Finder} = require('firefox-profile');
const {resolve} = require('path');

const EXTENSION_PATH = resolve('shells/firefox/build/unpacked');
const START_URL = 'https://facebook.github.io/react/';

const main = async () => {
  const finder = new Finder();

  // Use default Firefox profile for testing purposes.
  // This prevents users from having to re-login-to sites before testing.
  const findPathPromise = new Promise((resolvePromise, rejectPromise) => {
    finder.getPath('default', (error, profile) => {
      if (error) {
        rejectPromise(error);
      } else {
        resolvePromise(profile);
      }
    });
  });

  const path = await findPathPromise;
  const trimmedPath = path.replace(' ', '\\ ');

  await exec(
    `web-ext run --start-url=${START_URL} --firefox-profile=${trimmedPath} --browser-console`,
    {cwd: EXTENSION_PATH}
  );
};

main();
