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

import type {Theme} from '../../../frontend/types';
import type {Interaction, Snapshot} from '../ProfilerTypes';

import React, {Fragment} from 'react';
import { formatDuration, formatTime } from './constants';
import {sansSerif} from '../../../frontend/Themes/Fonts';
import Hoverable from '../../../frontend/Hoverable';

type ViewSnapshot = (snapshot: Snapshot) => void;

type Props = {|
  interaction: Interaction,
  selectedSnapshot: Snapshot | null,
  snapshots: Set<Snapshot>,
  theme: Theme,
  viewSnapshot: ViewSnapshot,
|};

const ProfilerInteractionDetailPane = ({
  interaction,
  selectedSnapshot,
  snapshots,
  theme,
  viewSnapshot,
}: Props) => (
  <Fragment>
    <div
      style={{
        height: '34px',
        lineHeight: '34px',
        padding: '0 0.5rem',
        backgroundColor: theme.base01,
        borderBottom: `1px solid ${theme.base03}`,
        fontSize: sansSerif.sizes.large,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      title={interaction.name}
    >
      {interaction.name}
    </div>
    <div style={{
      padding: '0.5rem',
    }}>
      <div><strong>Time</strong>: {formatTime(interaction.timestamp)}ms</div>
      <div style={{margin: '0.5rem 0'}}><strong>Renders</strong>:</div>
      <ul style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
      }}>
        {Array.from(snapshots).map((snapshot, index) => {
          let duration = 0;
          snapshot.committedNodes.forEach(nodeID => {
            duration = Math.max(snapshot.nodes.getIn([nodeID, 'actualDuration'], duration));
          });

          return (
            <SnapshotLink
              duration={duration}
              key={index}
              onClick={() => viewSnapshot(snapshot)}
              snapshot={snapshot}
              theme={theme}
              viewSnapshot={viewSnapshot}
            />
          );
        })}
      </ul>
    </div>
  </Fragment>
);

const SnapshotLink = Hoverable(
  ({ duration, isHovered, onClick, onMouseEnter, onMouseLeave, snapshot, theme, viewSnapshot }) => (
    <li
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        color: isHovered ? theme.state00 : theme.base05,
        textDecoration: isHovered ? 'underline' : 'none',
        cursor: 'pointer',
        marginBottom: '0.5rem',
      }}
    >
      Duration: {formatDuration(duration)}ms, at {formatTime(snapshot.commitTime)}s
    </li>
  )
);

export default ProfilerInteractionDetailPane;
