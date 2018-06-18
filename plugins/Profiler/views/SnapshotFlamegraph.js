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

import type {Snapshot} from '../ProfilerTypes';

const React = require('react');
const AutoSizer = require('react-virtualized-auto-sizer');
const Flamegraph = require('./Flamegraph');
import { didNotRender, gradient } from './colors';

type Props = {|
  snapshot: Snapshot,
|};

const SnapshotFlamegraph = ({snapshot}: Props) => {
  const rootNode = snapshot.nodes.get(snapshot.root);
  const children = rootNode.get('children');
  const rootNodeID = Array.isArray(children) ? children[0] : children;

  const data = convertSnapshotToChartData(snapshot, rootNodeID);

  return (
    <AutoSizer>
      {({ height, width }) => (
        <Flamegraph width={width} height={height} data={data} />
      )}
    </AutoSizer>
  );
};

const convertSnapshotToChartData = (snapshot, rootNodeID) => {
  let maxDuration = 0;

  snapshot.committedNodes.forEach(nodeID => {
    const duration = snapshot.nodes.getIn([nodeID, 'actualDuration']);
    if (duration > 0) {
      maxDuration = Math.max(maxDuration, duration);
    }
  });

  const convertNodeToDatum = nodeID => {
    const node = snapshot.nodes.get(nodeID).toJSON();
    const renderedInCommit = snapshot.committedNodes.includes(nodeID);
    const name = node.name || 'Unknown';

    return {
      children: node.children
        ? (Array.isArray(node.children) ? node.children : [node.children])
          .filter(childID => snapshot.nodes.has(childID))
          .map(convertNodeToDatum)
        : [],
      id: node.id,
      name: name,
      tooltip: renderedInCommit
        ? `${name} (render time ${node.actualDuration.toFixed(2)}ms)`
        : name,
      value: node.treeBaseTime,
      color: renderedInCommit
        ? gradient[Math.round((node.actualDuration / maxDuration) * (gradient.length - 1))]
        : didNotRender,
    };
  };

  return convertNodeToDatum(rootNodeID);
};

module.exports = SnapshotFlamegraph;
