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
import Simple from './DataView/Simple';
import previewComplex from './DataView/previewComplex';
import styles from './HooksTreeView.css';
import consts from '../agent/consts';

import type {HooksNode, HooksTree} from '../backend/types';
import type {Theme} from './types';

// $FlowFixMe
const { useCallback, useState } = React;

type HooksTreeViewProps = {
  hooksTree: HooksTree,
  inspect: Function,
  path?: Array<mixed>,
  theme: Theme,
};

function HooksTreeView({ hooksTree, inspect, path = ['hooksTree'], theme }: HooksTreeViewProps) {
  const length = hooksTree.length || hooksTree[consts.meta] && (hooksTree: any)[consts.meta].length || 0;
  const hooksNodeViews = [];
  for (let index = 0; index < length; index++) {
    hooksNodeViews.push(
      <HooksNodeView
        key={index}
        hooksNode={hooksTree[index]}
        index={index}
        inspect={inspect}
        path={path.concat(index, 'subHooks')}
        theme={theme}
      />
    );
  }
  return (
    <ul className={styles.list}>
      {hooksNodeViews}
    </ul>
  );
}

type HooksNodeViewProps = {
  hooksNode: HooksNode,
  index: number,
  inspect: Function,
  path: Array<mixed>,
  theme: Theme,
};

function HooksNodeView({ hooksNode, index, inspect, path, theme }: HooksNodeViewProps) {
  const {name, subHooks, value} = hooksNode;

  const isCustomHook = subHooks.length > 0 || subHooks[consts.meta] && (subHooks: any)[consts.meta].length > 0;
  const hasBeenHydrated = subHooks.length > 0 || subHooks[consts.inspected];

  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = useCallback(() => {
    if (!isCustomHook || isLoading) {
      return;
    }

    if (subHooks && subHooks[consts.inspected] === false) {
      if (inspect === null) {
        // The Profiler displays props/state for oudated Fibers.
        // These Fibers have already been mutated so they can't be inspected.
        return;
      }

      setIsLoading(true);
      setIsOpen(true);

      inspect(path, data => {
        setIsLoading(false);
      });
      return;
    }

    setIsOpen(!isOpen);
  }, [isLoading, isOpen]);

  const type = typeof value;
  let preview;
  if (type === 'number' || type === 'string' || value == null /* null or undefined */ || type === 'boolean') {
    preview = <Simple readOnly={true} path={[]} data={value} />;
  } else {
    preview = previewComplex((value: any), theme);
  }

  return (
    <div className={styles.listItem}>
      <div className={styles.nameValueRow} onClick={toggleOpen}>
        {isCustomHook &&
          <div className={styles.arrowContainer}>
            {isOpen && <span className={styles.expandedArrow}></span>}
            {!isOpen && <span className={styles.collapsedArrow}></span>}
          </div>}

        <div className={isCustomHook ? styles.nameCustom : styles.name}>
          {name}:
        </div> {<div className={styles.value}>{preview}</div>}
      </div>

      {hasBeenHydrated && isOpen &&
        <HooksTreeView
          hooksTree={subHooks}
          inspect={inspect}
          path={path}
          theme={theme}
        />}
    </div>
  );
}

// $FlowFixMe
export default React.memo(HooksTreeView);
