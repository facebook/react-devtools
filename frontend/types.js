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

var {Record} = require('immutable');

export type Dir = 'up' | 'down' | 'left' | 'right';
export type Dest = 'firstChild' | 'lastChild' | 'prevSibling' | 'nextSibling' | 'collapse' | 'uncollapse' | 'parent' | 'parentBottom';

export type ElementID = string;

export type Window = {
  frameElement: DOMNode | null,
};

export type Document = {
  defaultView: Window | null,
};

export type DOMNode = {
  appendChild: (child: DOMNode) => void,
  childNodes: Array<DOMNode>,
  getBoundingClientRect: () => DOMRect,
  innerHTML: string,
  innerText: string,
  nodeName: string,
  nodeType: number,
  offsetHeight: number,
  offsetLeft: number,
  offsetParent: ?DOMNode,
  offsetTop: number,
  offsetWidth: number,
  onclick?: (evt: DOMEvent) => void,
  parentNode: DOMNode,
  removeChild: (child: DOMNode) => void,
  removeListener: (evt: string, fn: () => void) => void,
  selectionStart: number,
  selectionEnd: number,
  scrollLeft: number,
  scrollTop: number,
  style: Object,
  textContent: string,
  value: string,
  ownerDocument: Document | null,
};

export type DOMEvent = {
  cancelBubble: boolean,
  key: string,
  keyCode: number,
  pageX: number,
  pageY: number,
  preventDefault: () => void,
  stopPropagation: () => void,
  target: DOMNode,
};

export type DOMRect = {
  top: number,
  left: number,
  width: number,
  height: number,
  bottom: number,
  right: number,
};

export type ControlState = {
  enabled: boolean,
} & Record;
