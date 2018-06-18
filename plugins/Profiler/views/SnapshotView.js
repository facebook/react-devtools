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

type Props = {|
  snapshot: Snapshot,
|};

const SnapshotView = ({snapshot}: Props) => {
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

// http://gka.github.io/palettes/#diverging|c0=#34bd65,#f4d03f|c1=#f4d03f,#ea384d,#f5344a|steps=50|bez0=1|bez1=1|coL0=0|coL1=0
const colorGradient = [
  '#34bd65', '#44be64', '#50bf62', '#5bc061', '#65c160', '#6fc25f', '#77c35d', '#80c45c', '#88c55b', '#8fc659', '#97c658',
  '#9ec756', '#a5c855', '#acc953', '#b2ca52', '#b9ca50', '#bfcb4e', '#c6cc4d', '#cccc4b', '#d2cd49', '#d9ce48', '#dfce46',
  '#e5cf44', '#ebcf42', '#f1d040', '#f4cb40', '#f5c142', '#f5b744', '#f5ae46', '#f4a447', '#f49c48', '#f49349', '#f48b49',
  '#f3834a', '#f37c4a', '#f3744b', '#f26d4b', '#f2674b', '#f2604b', '#f25a4b', '#f1544b', '#f14e4b', '#f2494b', '#f2444b',
  '#f2404b', '#f23c4b', '#f3394b', '#f3374a', '#f4354a', '#f5344a',
];
const didNotRenderColor = '#ddd';

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
        ? `${name} (render time ${Math.round(node.actualDuration * 10) / 10}ms)`
        : name,
      value: node.treeBaseTime,
      color: renderedInCommit
        ? colorGradient[Math.round((node.actualDuration / maxDuration) * (colorGradient.length - 1))]
        : didNotRenderColor,
    };
  };

  return convertNodeToDatum(rootNodeID);
};

module.exports = SnapshotView;
