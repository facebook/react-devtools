/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const FB_MODULE_RE = /^(.*) \[from (.*)\]$/;

// Hack: base class names are hardcoded because of internal FB transform that puts
// displayName on all modules. It resulted in displayName of React base classes shadowing
// actual ES6 class names. We can remove the hack if we use flat bundles on www, or
// if we stop automatically putting displayName on every exported function.
// We are using a regex because we also want to fix names like
// Connect(ReactComponent [from ReactComponent]) to be just Connect() for lack of better alternative.
const BASE_CLASS_NAMES_RE = /React(Pure)?Component \[from React(Pure)?Component\]/g;

const cachedDisplayNames = new WeakMap();

function getDisplayName(type: Function): string {
  if (cachedDisplayNames.has(type)) {
    return cachedDisplayNames.get(type);
  }

  let displayName =
    (type.displayName || '').replace(BASE_CLASS_NAMES_RE, '') ||
    type.name ||
    'Unknown';

  // Facebook-specific hack to turn "Image [from Image.react]" into just "Image".
  // We need displayName with module name for error reports but it clutters the DevTools.
  const match = displayName.match(FB_MODULE_RE);
  if (match) {
    const componentName = match[1];
    const moduleName = match[2];
    if (componentName && moduleName) {
      if (
        moduleName === componentName ||
        moduleName.startsWith(componentName + '.')
      ) {
        displayName = componentName;
      }
    }
  }

  cachedDisplayNames.set(type, displayName);
  return displayName;
}

module.exports = getDisplayName;
