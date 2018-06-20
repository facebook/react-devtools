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

import type {Theme} from '../../../frontend/types';

export const ChartAnimatedNode = {
  transition: 'all ease-in-out 250ms',
};

export const ChartRect = (theme: Theme) => ({
  stroke: theme.base00,
  ...ChartAnimatedNode,
});

// TODO?
// .profiler-graph rect:hover {
//   cursor: pointer;
// }

export const ChartLabel = {
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  fontSize: '12px',
  fontFamily: 'sans-serif',
  marginLeft: '4px',
  marginRight: '4px',
  lineHeight: '1.5',
  padding: '0 0 0',
  fontWeight: '400',
  color: 'black',
  textAlign: 'left',
  ...ChartAnimatedNode,
};

export const ChartNodeDimmed = {
  opacity: 0.6,
};
