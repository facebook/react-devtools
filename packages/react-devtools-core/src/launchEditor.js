/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var shellQuote = require('shell-quote');

function isTerminalEditor(editor) {
  switch (editor) {
    case 'vim':
    case 'emacs':
    case 'nano':
      return true;
  }
  return false;
}

// Map from full process name to binary that starts the process
// We can't just re-use full process name, because it will spawn a new instance
// of the app every time
var COMMON_EDITORS = {
  '/Applications/Atom.app/Contents/MacOS/Atom': 'atom',
  '/Applications/Atom Beta.app/Contents/MacOS/Atom Beta':
    '/Applications/Atom Beta.app/Contents/MacOS/Atom Beta',
  '/Applications/Sublime Text.app/Contents/MacOS/Sublime Text':
    '/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl',
  '/Applications/Sublime Text 2.app/Contents/MacOS/Sublime Text 2':
    '/Applications/Sublime Text 2.app/Contents/SharedSupport/bin/subl',
  '/Applications/Visual Studio Code.app/Contents/MacOS/Electron': 'code',
};

function getArgumentsForLineNumber(editor, filePath, lineNumber) {
  switch (path.basename(editor)) {
    case 'vim':
    case 'mvim':
      return [filePath, '+' + lineNumber];
    case 'atom':
    case 'Atom':
    case 'Atom Beta':
    case 'subl':
    case 'sublime':
    case 'wstorm':
    case 'appcode':
    case 'charm':
    case 'idea':
      return [filePath + ':' + lineNumber];
    case 'joe':
    case 'emacs':
    case 'emacsclient':
      return ['+' + lineNumber, filePath];
    case 'rmate':
    case 'mate':
    case 'mine':
      return ['--line', lineNumber, filePath];
    case 'code':
      return ['-g', filePath + ':' + lineNumber];
  }

  // For all others, drop the lineNumber until we have
  // a mapping above, since providing the lineNumber incorrectly
  // can result in errors or confusing behavior.
  return [filePath];
}

function guessEditor() {
  // Explicit config always wins
  if (process.env.REACT_EDITOR) {
    return shellQuote.parse(process.env.REACT_EDITOR);
  }

  // Using `ps x` on OSX we can find out which editor is currently running.
  // Potentially we could use similar technique for Windows and Linux
  if (process.platform === 'darwin') {
    try {
      var output = child_process.execSync('ps x').toString();
      var processNames = Object.keys(COMMON_EDITORS);
      for (var i = 0; i < processNames.length; i++) {
        var processName = processNames[i];
        if (output.indexOf(processName) !== -1) {
          return [COMMON_EDITORS[processName]];
        }
      }
    } catch (error) {
      // Ignore...
    }
  }

  // Last resort, use old skool env vars
  if (process.env.VISUAL) {
    return [process.env.VISUAL];
  } else if (process.env.EDITOR) {
    return [process.env.EDITOR];
  }

  return [];
}

var _childProcess = null;
function launchEditor(maybeRelativePath, lineNumber, absoluteProjectRoots) {
  // We use relative paths at Facebook we deterministic builds.
  // This is why our internal tooling calls React DevTools with absoluteProjectRoots.
  // If the filename is absolute then we don't need to care about this.
  var filePath = [maybeRelativePath]
    .concat(
      absoluteProjectRoots.map(root => path.join(root, maybeRelativePath))
    ).find(combinedPath =>
      fs.existsSync(combinedPath)
    );

  if (!filePath) {
    return;
  }

  // Sanitize lineNumber to prevent malicious use on win32
  // via: https://github.com/nodejs/node/blob/c3bb4b1aa5e907d489619fb43d233c3336bfc03d/lib/child_process.js#L333
  if (lineNumber && isNaN(lineNumber)) {
    return;
  }

  var [editor, ...args] = guessEditor();
  if (!editor) {
    return;
  }

  if (lineNumber) {
    args = args.concat(getArgumentsForLineNumber(editor, filePath, lineNumber));
  } else {
    args.push(filePath);
  }

  if (_childProcess && isTerminalEditor(editor)) {
    // There's an existing editor process already and it's attached
    // to the terminal, so go kill it. Otherwise two separate editor
    // instances attach to the stdin/stdout which gets confusing.
    _childProcess.kill('SIGKILL');
  }

  if (process.platform === 'win32') {
    // On Windows, launch the editor in a shell because spawn can only
    // launch .exe files.
    _childProcess = child_process.spawn('cmd.exe', ['/C', editor].concat(args), {stdio: 'inherit'});
  } else {
    _childProcess = child_process.spawn(editor, args, {stdio: 'inherit'});
  }
  _childProcess.on('error', function() {});
  _childProcess.on('exit', function(errorCode) {
    _childProcess = null;
  });
}

module.exports = launchEditor;
