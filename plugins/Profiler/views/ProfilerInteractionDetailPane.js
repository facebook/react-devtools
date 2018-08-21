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
import { formatDuration, formatPercentage, formatTime } from './constants';
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
}: Props) => {
  let currentTimestamp = interaction.timestamp;

  return (
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
        <div><strong>Timestamp</strong>: {formatTime(interaction.timestamp)}s</div>
        <div style={{margin: '0.5rem 0'}}><strong>Renders</strong>:</div>
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
  onClick,
  onMouseEnter,
  onMouseLeave,
  previousTimestamp,
  selectedSnapshot,
  snapshot,
  theme,
  viewSnapshot,
}) => {
  const cpuPercentage = Math.max(0, Math.min(snapshot.duration / (snapshot.commitTime - previousTimestamp)));
  const cpuSvg = CPU_SVGS[Math.round(cpuPercentage * (CPU_SVGS.length - 1))];

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
        borderBottom: `1px solid ${theme.base01}`,
      }}
    >
      {cpuSvg}
      <ul style={{paddingLeft: '1.5rem'}}>
        <li>Timestamp: {formatTime(snapshot.commitTime)}s</li>
        <li>Duration: {formatDuration(snapshot.duration)}ms</li>
        <li>CPU: {formatPercentage(cpuPercentage)}%</li>
      </ul>
    </li>
  );
});

const CPU_STYLE = {
  width: '1.5rem',
  height: '1.5rem',
  fill: 'currentColor',
  marginRight: '0.5rem',
};

const CPU_0 = (
  <svg style={CPU_STYLE} viewBox="0 0 24 24">
    <path fillOpacity=".3" d="M2 22h20V2z" />
  </svg>
);

const CPU_25 = (
  <svg style={CPU_STYLE} viewBox="0 0 24 24">
    <path fillOpacity=".3" d="M2 22h20V2z" />
    <path d="M12 12L2 22h10z" />
  </svg>
);

const CPU_50 = (
  <svg style={CPU_STYLE} viewBox="0 0 24 24">
    <path fillOpacity=".3" d="M2 22h20V2z" />
    <path d="M14 10L2 22h12z" />
  </svg>
);

const CPU_75 = (
  <svg style={CPU_STYLE} viewBox="0 0 24 24">
    <path fillOpacity=".3" d="M2 22h20V2z" />
    <path d="M17 7L2 22h15z" />
  </svg>
);

const CPU_100 = (
  <svg style={CPU_STYLE} viewBox="0 0 24 24">
    <path d="M2 22h20V2z" />
  </svg>
);

const CPU_SVGS = [CPU_0, CPU_25, CPU_50, CPU_75, CPU_100];

export default ProfilerInteractionDetailPane;
