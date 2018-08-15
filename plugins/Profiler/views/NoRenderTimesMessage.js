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
  stopInspecting: Function,
  width: number,
|};

export default ({ height, stopInspecting, width }: Props) => (
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
      No render times were recorded for the selected element
    </p>
    <p>
      <button onClick={stopInspecting}>Return to the previous view</button>
    </p>
  </div>
);
