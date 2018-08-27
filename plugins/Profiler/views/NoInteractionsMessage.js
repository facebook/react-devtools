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

import React from 'react';
import {sansSerif} from '../../../frontend/Themes/Fonts';

type Props = {|
  hasMultipleRoots: boolean,
  height: number,
  width: number,
|};

export default ({ hasMultipleRoots, height, width }: Props) => {
  let headerText;
  if (hasMultipleRoots) {
    headerText = 'No interactions were recorded for the selected root.';
  } else {
    headerText = 'No interactions were recorded.';
  }

  return (
    <div style={{
      height,
      width,
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <p style={{
        fontSize: sansSerif.sizes.large,
      }}>
        {headerText}
      </p>
      {hasMultipleRoots && (
        <p>
          You may want to select a different root in the <strong>Elements</strong> panel.
        </p>
      )}
      <p>
        <a href="https://fb.me/react-interaction-tracking" target="_blank">
          Learn more about the interaction tracking API here
        </a>.
      </p>
    </div>
  );
};
