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

// http://gka.github.io/palettes/#diverging|c0=#34bd65,#f4d03f|c1=#f4d03f,#ea384d,#f5344a|steps=50|bez0=1|bez1=1|coL0=0|coL1=0
export const gradient = [
  '#34bd65', '#44be64', '#50bf62', '#5bc061', '#65c160', '#6fc25f', '#77c35d', '#80c45c', '#88c55b', '#8fc659', '#97c658',
  '#9ec756', '#a5c855', '#acc953', '#b2ca52', '#b9ca50', '#bfcb4e', '#c6cc4d', '#cccc4b', '#d2cd49', '#d9ce48', '#dfce46',
  '#e5cf44', '#ebcf42', '#f1d040', '#f4cb40', '#f5c142', '#f5b744', '#f5ae46', '#f4a447', '#f49c48', '#f49349', '#f48b49',
  '#f3834a', '#f37c4a', '#f3744b', '#f26d4b', '#f2674b', '#f2604b', '#f25a4b', '#f1544b', '#f14e4b', '#f2494b', '#f2444b',
  '#f2404b', '#f23c4b', '#f3394b', '#f3374a', '#f4354a', '#f5344a',
];

export const didNotRender = '#ddd';

export const barHeight = 20;
export const barWidth = 100;
export const barWidthThreshold = 2;
export const minBarHeight = 5;
export const minBarWidth = 5;
export const textHeight = 18;

export const scale = (minValue: number, maxValue: number, minRange: number, maxRange: number) => (value: number) =>
  (value / (maxValue - minValue)) * (maxRange - minRange);

export const getGradientColor = (value: number) => gradient[Math.round(value * (gradient.length - 1))];
