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
import SvgIcon from '../../../frontend/SvgIcon';
import Icons from '../../../frontend/Icons';

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
}: InteractionsListProps) => (
  <div style={{
    height,
    overflow: 'auto',
    width,
  }}>
    <ul style={{
      listStyle: 'none',
    }}>
      {Array.from(interactionsToSnapshots).map(([interaction, snapshots], interactionIndex) => (
        <li
          key={interaction.timestamp}
          style={{
            position: 'relative',
            padding: '0 0 0.25rem',
            margin: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '0.25rem',
              top: '0.5rem',
              height: '100%',
              backgroundColor: theme.base02,
              width: '0.25rem',
              display: interactionsToSnapshots.size === interactionIndex + 1 ? 'none' : 'block',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '0.75rem',
              height: '0.75rem',
              borderRadius: '0.75rem',
              backgroundColor: theme.base00,
              border: `3px solid ${theme.state00}`,
              boxSizing: 'border-box',
            }}
          />
          <div
            style={{
              position: 'relative',
              margin: '0 0 0 1.25rem',
              top: '-0.125rem',
            }}
          >
            <strong>{interaction.name}</strong> at {formatTime(interaction.timestamp)}ms

            {Array.from(snapshots).map((snapshot, snapshotIndex) => {
              let duration = 0;
              snapshot.committedNodes.forEach(nodeID => {
                duration = Math.max(snapshot.nodes.getIn([nodeID, 'actualDuration'], duration));
              });

              return (
                <p
                  key={snapshotIndex}
                  onClick={() => selectSnapshot(snapshot)}
                  style={{
                    cursor: 'pointer',
                    margin: '0.5rem 0',
                  }}
                >
                  <SvgIcon
                    path={Icons.VIEW_DETAILS}
                    style={{
                      width: '1rem',
                      height: '1rem',
                      fill: 'currentColor',
                      display: 'inline',
                      verticalAlign: 'sub',
                      marginRight: '0.25rem',
                    }}
                  />
                  Rendered for {Math.round(duration * 10) / 10}ms (at {formatTime(snapshot.commitTime)}ms)
                </p>
              );
            })}
          </div>
        </li>
      ))}
    </ul>
  </div>
);

const formatTime = (timestamp: number) => Math.round(Math.round(timestamp) / 100) / 10;

export default InteractionTimeline;
