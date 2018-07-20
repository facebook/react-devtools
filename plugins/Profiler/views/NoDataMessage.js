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
    <strong>There is no data to display for the current selection.</strong>
    <br/>
    This can indicate that a render occurred too quickly for the timing API to measure.
  </div>
);
