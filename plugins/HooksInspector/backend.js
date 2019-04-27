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

import {inspectHooksOfFiber} from '../../backend/ReactDebugHooks';

import type {InspectedHooks} from '../../backend/types';
import type Agent from '../../agent/Agent';
import type Bridge from '../../agent/Bridge';

type ElementID = string;

export default function setupHooksInspector(bridge: Bridge, agent: Agent) {
  let prevHooksTree: InspectedHooks | null = null;
  let selectedID: ElementID | null = null;

  agent.on('selected', (id: ElementID) => {
    selectedID = id;

    const data = agent.elementData.get(id);
    let hooksTree = null;
    if (data && data.containsHooks) {
      hooksTree = inspectHooksTree(id);
    }

    if (prevHooksTree !== hooksTree) {
      prevHooksTree = hooksTree;
      bridge.send('inspectedHooks', hooksTree);
    }
  });

  agent.on('update', (data: Object) => {
    // If the element that was just updated is also being inspected, update the hooks values.
    if (
      selectedID !== null &&
      prevHooksTree !== null &&
      prevHooksTree.elementID === data.id
    ) {
      const hooksTree = inspectHooksTree(data.id);
      if (prevHooksTree !== hooksTree) {
        prevHooksTree = hooksTree;
        bridge.send('inspectedHooks', hooksTree);
      }
    }
  });

  function inspectHooksTree(id: ElementID): InspectedHooks | null {
    const data = agent.elementData.get(id);
    const internalInstance = agent.internalInstancesById.get(id);
    if (internalInstance) {
      const rendererID = agent.renderers.get(id);
      if (rendererID) {
        const internals = agent.reactInternals[rendererID].renderer;
        if (internals && internals.currentDispatcherRef) {
          // HACK: This leaks Fiber-specific logic into the Agent which is not ideal.
          // $FlowFixMe
          const currentFiber = data.state === internalInstance.memoizedState ? internalInstance : internalInstance.alternate;

          const hooksTree = inspectHooksOfFiber(currentFiber, internals.currentDispatcherRef);

          // It's also important to store the element ID,
          // so the frontend can avoid potentially showing the wrong hooks data for an element,
          // (since hooks inspection is done as part of a separate Bridge message).
          // But we can't store it as "id"– because the Bridge stores a map of "inspectable" data keyed by this field.
          // Use an id that won't conflict with the element itself (because we don't want to override data).
          // This is important if components have both inspectable props and inspectable hooks.
          return {
            elementID: id,
            id: 'hooksTree',
            hooksTree,
          };
        }
      }
    }
    return null;
  }
}
