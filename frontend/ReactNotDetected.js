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

var React = require('react');
var Message = require('./Message');

function ReactNotDetected() {
  return (
    <Message>
      <h3>React was not detected on this page.</h3>
      <p>
        If this seems wrong, follow the
        {' '}
        <a
          style={styles.link}
          href="https://github.com/facebook/react-devtools/blob/master/README.md#the-react-tab-doesnt-show-up"
          target="_blank"
        >
          troubleshooting instructions
        </a>
        .
      </p>
    </Message>
  );
}

var styles = {
  link: {
    textDecoration: 'underline',
  },
};

module.exports = ReactNotDetected;
