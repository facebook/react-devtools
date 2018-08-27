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
import {formatDuration, formatTime} from './constants';
import {sansSerif} from '../../../frontend/Themes/Fonts';
import Hoverable from '../../../frontend/Hoverable';

type Props = {|
  selectedInteraction: Interaction | null,
  snapshot: Snapshot,
  theme: Theme,
  viewInteraction: (interaction: Interaction) => void,
|};

const ProfilerSnapshotDetailPane = ({
  selectedInteraction,
  snapshot,
  theme,
  viewInteraction,
}: Props) => (
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
      }}
    >
      Commit information
    </div>
    <div style={{
      padding: '0.5rem',
    }}>
      <div><strong>Committed at</strong>: {formatTime(snapshot.commitTime)}s</div>
      <div style={{marginTop: '0.5rem'}}><strong>Render duration</strong>: {formatDuration(snapshot.duration)}ms</div>
      <div style={{margin: '0.5rem 0'}}><strong>Interactions</strong>:</div>
      <ul style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
      }}>
        {snapshot.memoizedInteractions.length === 0 && (
          <li style={{padding: '0.5rem'}}>
            None
          </li>
        )}
        {snapshot.memoizedInteractions.map((interaction, index) => (
          <InteractionLink
            interaction={interaction}
            key={index}
            onClick={() => viewInteraction(interaction)}
            selectedInteraction={selectedInteraction}
            theme={theme}
          />
        ))}
      </ul>
    </div>
  </Fragment>
);

const InteractionLink = Hoverable(({
  interaction,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
  selectedInteraction,
  theme,
}) => (
  <li
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    style={{
      backgroundColor: isHovered ? theme.state03 : (selectedInteraction === interaction ? theme.base01 : 'transparent'),
      color: isHovered ? theme.state00 : 'inherit',
      textDecoration: isHovered ? 'underline' : 'none',
      cursor: 'pointer',
      padding: '0.5rem',
      borderBottom: `1px solid ${theme.base01}`,
    }}
  >
    "{interaction.name}" at {formatTime(interaction.timestamp)}s
  </li>
));

export default ProfilerSnapshotDetailPane;
