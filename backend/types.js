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

type CompositeUpdater = {
  canUpdate: boolean,
  setInProps: ?(path: Array<string>, value: any) => void,
  setInState: ?(path: Array<string>, value: any) => void,
  setInContext: ?(path: Array<string>, value: any) => void,
};

type NativeUpdater = {
  setNativeProps: ?(nativeProps: {[key: string]: any}) => void,
};

export type Interaction = {|
  name: string,
  timestamp: number,
|};

export type DataType = {
  nodeType: 'Native' | 'Wrapper' | 'NativeWrapper' | 'Composite' | 'Special' | 'Text' | 'Portal' | 'Empty',
  type: ?(string | AnyFn),
  key: ?string,
  ref: ?(string | AnyFn),
  source: ?Object,
  name: ?string,
  props: ?Object,
  state: ?Object,
  context: ?Object,
  children: ?(string | Array<OpaqueNodeHandle>),
  text: ?string,
  updater: ?(CompositeUpdater | NativeUpdater),
  publicInstance: ?Object,

  // Tracing
  memoizedInteractions: ?Set<Interaction>,

  // Profiler
  actualDuration: ?number,
  actualStartTime: ?number,
  treeBaseDuration: ?number,
};

// This type is entirely opaque to the backend.
export type OpaqueNodeHandle = {
  _rootNodeID: string,
};
export type NativeType = {};
export type RendererID = string;

type DOMNode = {};

export type AnyFn = (...args: Array<any>) => any;

type BundleType =
  // PROD
  | 0
  // DEV
  | 1;

export type ReactRenderer = {
  // Fiber
  findHostInstanceByFiber: (fiber: Object) => ?NativeType,
  findFiberByHostInstance: (hostInstance: NativeType) => ?OpaqueNodeHandle,
  version: string,
  bundleType: BundleType,
  overrideProps?: ?(fiber: Object, path: Array<string | number>, value: any) => void,

  // Stack
  Reconciler: {
    mountComponent: AnyFn,
    performUpdateIfNecessary: AnyFn,
    receiveComponent: AnyFn,
    unmountComponent: AnyFn,
  },
  Component?: {
    Mixin: Object,
  },
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
  ComponentTree: {
    getNodeFromInstance: (component: OpaqueNodeHandle) => ?NativeType,
    getClosestInstanceFromNode: (component: NativeType) => ?OpaqueNodeHandle,
  },
  currentDispatcherRef?: {
    current: null | Object,
  },
};

export type Helpers = {
  getNativeFromReactElement?: ?(component: OpaqueNodeHandle) => ?NativeType,
  getReactElementFromNative?: ?(component: NativeType) => ?OpaqueNodeHandle,
  walkTree: (visit: (component: OpaqueNodeHandle, data: DataType) => void, visitRoot: (element: OpaqueNodeHandle) => void) => void,
  cleanup: () => void,
  renderer: ReactRenderer | null,
};

export type Handler = (data: any) => void;

export type Hook = {
  _renderers: {[key: string]: ReactRenderer},
  _listeners: {[key: string]: Array<Handler>},
  helpers: {[key: string]: Helpers},
  inject: (renderer: ReactRenderer) => string | null,
  emit: (evt: string, data: any) => void,
  sub: (evt: string, handler: Handler) => () => void,
  on: (evt: string, handler: Handler) => void,
  off: (evt: string, handler: Handler) => void,
  reactDevtoolsAgent?: ?Object,
  getFiberRoots: (rendererID : string) => Set<Object>,
};

export type HooksNode = {
  name: string,
  value: mixed,
  subHooks: Array<HooksNode>,
};
export type HooksTree = Array<HooksNode>;

export type InspectedHooks = {|
  elementID: string,
  id: string,
  hooksTree: HooksTree,
|};
