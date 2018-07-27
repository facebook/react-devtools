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

import type {Interaction, Snapshot} from '../ProfilerTypes';
import type {Theme} from '../../../frontend/types';

import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';

// TODO (bvaughn) This UI is pretty minimal, maybe not even MVP.

type SelectSnapshot = (snapshot: Snapshot) => void;

type Props = {|
  interactionsToSnapshots: Map<Interaction, Set<Snapshot>>,
  selectSnapshot: SelectSnapshot,
  theme: Theme,
  timestampsToInteractions: Map<number, Set<Interaction>>,
|};

const InteractionTimeline = ({
  interactionsToSnapshots,
  selectSnapshot,
  theme,
  timestampsToInteractions,
}: Props) => {
  if (interactionsToSnapshots.size === 0) {
    return (
      <div style={{
        height: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        No interactions were recorded for the current root.
      </div>
    );
  }

  return (
    <AutoSizer>
      {({ height, width }) => (
        <InteractionsList
          height={height}
          interactionsToSnapshots={interactionsToSnapshots}
          selectSnapshot={selectSnapshot}
          theme={theme}
          timestampsToInteractions={timestampsToInteractions}
          width={width}
        />
      )}
    </AutoSizer>
  );
};

type InteractionsListProps = {|
  height: number,
  interactionsToSnapshots: Map<Interaction, Set<Snapshot>>,
  selectSnapshot: SelectSnapshot,
  theme: Theme,
  timestampsToInteractions: Map<number, Set<Interaction>>,
  width: number,
|};

const InteractionsList = ({
  height,
  interactionsToSnapshots,
  selectSnapshot,
  theme,
  timestampsToInteractions,
  width,
}: InteractionsListProps) => {
  return (
    <div style={{
      height,
      overflow: 'auto',
      width,
    }}>
      {Array.from(interactionsToSnapshots).map(([interaction, snapshots]) => (
        <div key={interaction.timestamp}>
          <strong>{interaction.name}</strong> at {Math.round(interaction.timestamp * 10) / 10}ms.
          <ul>
            {Array.from(snapshots).map((snapshot, index) => {
              let duration = 0;
              snapshot.committedNodes.forEach(nodeID => {
                duration = Math.max(snapshot.nodes.getIn([nodeID, 'actualDuration'], duration));
              });

              return (
                <div
                  key={index}
                  onClick={() => selectSnapshot(snapshot)}
                  style={{
                    cursor: 'pointer',
                  }}
                >
                  Rendered for {Math.round(duration * 10) / 10}ms.
                  Committed at {Math.round(snapshot.commitTime * 10) / 10}ms.
                </div>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default InteractionTimeline;
