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
import { getGradientColor, formatDuration, formatTime } from './constants';
import {sansSerif} from '../../../frontend/Themes/Fonts';
import Hoverable from '../../../frontend/Hoverable';

type ViewSnapshot = (snapshot: Snapshot) => void;

type Props = {|
  interaction: Interaction,
  maxDuration: number,
  selectedSnapshot: Snapshot | null,
  snapshots: Set<Snapshot>,
  theme: Theme,
  viewSnapshot: ViewSnapshot,
|};

const ProfilerInteractionDetailPane = ({
  interaction,
  maxDuration,
  selectedSnapshot,
  snapshots,
  theme,
  viewSnapshot,
}: Props) => {
  let currentTimestamp = interaction.timestamp;

  return (
    <Fragment>
      <div
        style={{
          height: '2rem',
          lineHeight: '2rem',
          padding: '0 0.5rem',
          backgroundColor: theme.base01,
          borderBottom: `1px solid ${theme.base03}`,
          fontSize: sansSerif.sizes.large,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'flex',
          justifyContent: 'space-between',
        }}
        title={interaction.name}
      >
        {interaction.name} at {formatTime(interaction.timestamp)}s
      </div>
      <div style={{
        padding: '0.5rem',
      }}>
        <div style={{marginBottom: '0.5rem'}}>
          <strong>Commits</strong>:
        </div>
        <ul style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}>
          {Array.from(snapshots).map((snapshot, index) => {
            const previousTimestamp = currentTimestamp;
            currentTimestamp = snapshot.commitTime;

            return (
              <SnapshotLink
                key={index}
                maxDuration={maxDuration}
                onClick={() => viewSnapshot(snapshot)}
                previousTimestamp={previousTimestamp}
                selectedSnapshot={selectedSnapshot}
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
};

const SnapshotLink = Hoverable(({
  isHovered,
  maxDuration,
  onClick,
  onMouseEnter,
  onMouseLeave,
  previousTimestamp,
  selectedSnapshot,
  snapshot,
  theme,
  viewSnapshot,
}) => {
  return (
    <li
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        backgroundColor: isHovered ? theme.state03 : (selectedSnapshot === snapshot ? theme.base01 : 'transparent'),
        color: isHovered ? theme.state00 : 'inherit',
        textDecoration: isHovered ? 'underline' : 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: '0.5rem',
        borderTop: `1px solid ${theme.base01}`,
      }}
    >
      <div
        style={{
          width: '1rem',
          height: '1rem',
          backgroundColor: selectedSnapshot === snapshot
            ? theme.state06
            : getGradientColor(snapshot.duration / maxDuration),
        }}
      />
      <ul style={{paddingLeft: '1.5rem'}}>
        <li style={{marginBottom: '0.25rem'}}>
          Timestamp: {formatTime(snapshot.commitTime)}s
        </li>
        <li>
          Duration: {formatDuration(snapshot.duration)}ms
        </li>
      </ul>
    </li>
  );
});

export default ProfilerInteractionDetailPane;
