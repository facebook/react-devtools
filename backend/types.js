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

export type DataType = {
  nodeType: 'Native' | 'Wrapper' | 'NativeWrapper' | 'Composite' | 'Text',
  type: ?(string | AnyFn),
  name: ?string,
  props: ?Object,
  state: ?Object,
  context: ?Object,
  children: ?(string | Array<OpaqueReactElement>),
  text: ?string,
  updater: ?{
    setInProps: ?(path: Array<string>, value: any) => void,
    setInState: ?(path: Array<string>, value: any) => void,
    setInContext: ?(path: Array<string>, value: any) => void,
    // setState: ?(newState: any) => void,
    forceUpdate: ?() => void,
  },
  publicInstance: ?Object,
};

// This type is entirely opaque to the backend.
export type OpaqueReactElement = {
  _rootNodeID: string,
};
export type NativeType = {};

type DOMNode = {};

export type AnyFn = (...args: Array<any>) => any;

export type ReactRenderer = {
  Reconciler: {
    mountComponent: AnyFn,
    performUpdateIfNecessary: AnyFn,
    receiveComponent: AnyFn,
    unmountComponent: AnyFn,
  },
  Component?: {
    Mixin: Object,
  },
  // $ FlowFixMe flow doesn't understand this tagged union
  Mount: {
    // React Native
    nativeTagToRootNodeID: (tag: ?NativeType) => string,
    findNodeHandle: (component: Object) => ?NativeType,
    renderComponent: AnyFn,
    _instancesByContainerID: Object,

    // React DOM
    getID: (node: DOMNode) => string,
    getNode: (id: string) => ?DOMNode,
    _instancesByReactRootID: Object,
    _renderNewRootComponent: AnyFn,
  },
};

export type Helpers = {
  getNativeFromReactElement?: ?(component: OpaqueReactElement) => ?NativeType,
  getReactElementFromNative?: ?(component: NativeType) => ?OpaqueReactElement,
  walkTree: (visit: (component: OpaqueReactElement, data: DataType) => void, visitRoot: (element: OpaqueReactElement) => void) => void,
  cleanup: () => void,
};

export type Handler = (data: any) => void;


export type Hook = {
  _renderers: {[key: string]: ReactRenderer},
  _listeners: {[key: string]: Array<Handler>},
  helpers: {[key: string]: Helpers},
  inject: (renderer: ReactRenderer) => void,
  emit: (evt: string, data: any) => void,
  sub: (evt: string, handler: Handler) => () => void,
  on: (evt: string, handler: Handler) => void,
  off: (evt: string, handler: Handler) => void,
  reactDevtoolsAgent?: ?Object,
};
