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

export type Dir = 'up' | 'down' | 'left' | 'right';
export type Dest = 'firstChild' | 'lastChild' | 'prevSibling' | 'nextSibling' | 'collapse' | 'uncollapse' | 'parent' | 'parentBottom';

export type ElementID = string;

export type DOMNode = {
  nodeName: string,
  style: Object,
  offsetTop: number,
  offsetLeft: number,
  offsetHeight: number,
  offsetWidth: number,
  offsetParent: ?DOMNode,
  getBoundingClientRect: () => {
    top: number,
    left: number,
    width: number,
    height: number,
    bottom: number,
    right: number,
  },
  onclick?: (evt: DOMEvent) => void,
  scrollLeft: number,
  scrollTop: number,
  appendChild: (child: DOMNode) => void,
  removeChild: (child: DOMNode) => void,
  parentNode: DOMNode,
  innerText: string,
  value: string,
  innerHTML: string,
  textContent: string,
  removeListener: (evt: string, fn: () => void) => void,
};

export type DOMEvent = {
  target: DOMNode,
  pageX: number,
  pageY: number,
  preventDefault: () => void,
  stopPropagation: () => void,
  cancelBubble: boolean,
  keyCode: number,
};
