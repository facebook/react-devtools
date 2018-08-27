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
  height: number,
  width: number,
|};

export default ({ height, width }: Props) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    height,
    width,
  }}>
    <p style={{
      fontSize: sansSerif.sizes.large,
    }}>
      There is no timing data to display for the currently selected commit.
    </p>
    <p>
      This can indicate that a render occurred too quickly for the timing API to measure.
      Try selecting another commit in the upper, right-hand corner.
    </p>
  </div>
);
