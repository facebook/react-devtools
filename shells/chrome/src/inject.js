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

declare var chrome: {
  devtools: {
    inspectedWindow: {
      eval: (code: string, cb?: (res: any, err: ?Object) => any) => void,
    },
  },
};

module.exports = function (scriptName: string, done: () => void) {
  var src = `
  // the prototype stuff is in case document.createElement has been modified
  var iframe = document.constructor.prototype.createElement.call(document, 'iframe');
  iframe.style.display = 'none';
  document.head.appendChild(iframe);
  var doc = iframe.contentDocument;
  var script = doc.createElement('script');
  script.src = "${scriptName}";
  doc.body.appendChild(script);
  script.parentNode.removeChild(script);
  `;

  chrome.devtools.inspectedWindow.eval(src, function (res, err) {
    if (err) {
      console.log(err);
    }
    done();
  });
};

