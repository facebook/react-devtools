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

type RGB = {
	r: number,
	g: number,
	b: number,
};

function getBrightness(hex: string): number {
  const {r, g, b} = getRgb(hex);

  // http://www.w3.org/TR/AERT#color-contrast
  return Math.round(((r * 299) + (g * 587) + (b * 114)) / 1000);
}

function getInvertedMid(hex: string): string {
  return hexToRgba(hex, 0.8);
}

function getInvertedWeak(hex: string): string {
  return hexToRgba(hex, 0.65);
}

function getRgb(hex: string = ''): RGB {
  hex = hex.replace('#', '');

  if (hex.length === 3) {
    hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return {r, g, b};
}

function hexToRgba(hex: string, alpha: number): string {
  const {r, g, b} = getRgb(hex);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function isBright(hex: string): boolean {
  // http://www.w3.org/TR/AERT#color-contrast
  return getBrightness(hex) > 125;
}

module.exports = {
  getBrightness,
  getInvertedMid,
  getInvertedWeak,
  getRgb,
  hexToRgba,
  isBright,
};
