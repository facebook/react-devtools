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
import type {Chart} from './ViewTypes';
import type {Snapshot} from '../ProfilerTypes';

import React, { Fragment } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import Hoverable from '../../../frontend/Hoverable';
import SvgIcon from '../../../frontend/SvgIcon';
import Icons from '../../../frontend/Icons';
import IconButton from './IconButton';

const CHART_LABEL_WIDTH_THRESHOLD = 615;

type Props = {|
  handleSnapshotSliderChange: Function,
  interactionsCount: number,
  isInspectingSelectedFiber: boolean,
  isRecording: boolean,
  selectChart: (chart: Chart) => void,
  selectNextSnapshotIndex: Function,
  selectPreviousSnapshotIndex: Function,
  selectedChart: Chart,
  snapshotIndex: number,
  snapshots: Array<Snapshot>,
  theme: Theme,
  toggleIsRecording: Function,
|};

export default (props: Props) => (
  <AutoSizer disableHeight={true}>
    {({ width }) => (
      <ProfilerTabToolbar {...props} width={width} />
    )}
  </AutoSizer>
);

type ProfilerTabToolbarProps = {
  handleSnapshotSliderChange: Function,
  interactionsCount: number,
  isInspectingSelectedFiber: boolean,
  isRecording: boolean,
  selectChart: (chart: Chart) => void,
  selectNextSnapshotIndex: Function,
  selectPreviousSnapshotIndex: Function,
  selectedChart: Chart,
  snapshotIndex: number,
  snapshots: Array<Snapshot>,
  theme: Theme,
  toggleIsRecording: Function,
  width: number,
};

const ProfilerTabToolbar = ({
  handleSnapshotSliderChange,
  interactionsCount,
  isInspectingSelectedFiber,
  isRecording,
  selectChart,
  selectNextSnapshotIndex,
  selectPreviousSnapshotIndex,
  selectedChart,
  snapshotIndex,
  snapshots,
  theme,
  toggleIsRecording,
  width,
}: ProfilerTabToolbarProps) => (
  <div style={{
    display: 'flex',
    flex: '0 0 auto',
    padding: '0.25rem',
    flexWrap: 'wrap',
    alignItems: 'center',
    position: 'relative',
    boxSizing: 'border-box',
    width,
  }}>
    <RecordButton
      isActive={isRecording}
      onClick={toggleIsRecording}
      theme={theme}
    />

    <HRule theme={theme} />

    {!isRecording && snapshots.length > 0 && (
      <Fragment>
         {/* TODO (bvaughn) Disable if there are no interactions */}
         <RadioOption
           icon={Icons.INTERACTION}
           isChecked={!isInspectingSelectedFiber && selectedChart === 'interactions'}
           isDisabled={interactionsCount === 0}
           label="Interactions"
           onChange={() => selectChart('interactions')}
           width={width}
         />
        &nbsp;
         <RadioOption
           icon={Icons.FLAME_CHART}
           isChecked={!isInspectingSelectedFiber && selectedChart === 'flamegraph'}
           isDisabled={false}
           label="Flamegraph"
           onChange={() => selectChart('flamegraph')}
           width={width}
         />
        &nbsp;
         <RadioOption
           icon={Icons.RANKED_CHART}
           isChecked={!isInspectingSelectedFiber && selectedChart === 'ranked'}
           isDisabled={false}
           label="Ranked"
           onChange={() => selectChart('ranked')}
           width={width}
         />

        <div style={{flex: 1}} />

        {/* Re-introduce this toggle if we want to support this functionality...
          <label
            style={{
              opacity: isInspectingSelectedFiber ? 0.5 : 1,
            }}
          >
            <input
              type="checkbox"
              disabled={isInspectingSelectedFiber}
              checked={showNativeNodes}
              onChange={toggleShowNativeNodes}
            /> Show native?
          </label>

          <div style={{flex: 1}} />
        */}

        <HRule theme={theme} />

        <span>{snapshotIndex + 1} / {snapshots.length}</span>
        <IconButton
          disabled={snapshotIndex === 0 || isInspectingSelectedFiber}
          icon={Icons.BACK}
          isTransparent={true}
          onClick={selectPreviousSnapshotIndex}
          theme={theme}
          title="Previous render"
        />
        <input
          disabled={isInspectingSelectedFiber}
          type="range"
          min={0}
          max={snapshots.length - 1}
          value={snapshotIndex}
          onChange={handleSnapshotSliderChange}
        />
        <IconButton
          disabled={snapshotIndex === snapshots.length - 1 || isInspectingSelectedFiber}
          icon={Icons.FORWARD}
          isTransparent={true}
          onClick={selectNextSnapshotIndex}
          theme={theme}
          title="Next render"
        />
      </Fragment>
    )}
  </div>
);

const HRule = ({ theme }) => (
  <div style={{
    height: '18px',
    width: '1px',
    backgroundColor: theme.base03,
    margin: '0 0.5rem',
  }} />
);

const RadioOption = ({ icon, isChecked, isDisabled, label, onChange, width }) => (
  <label style={{marginRight: '0.5rem'}}>
    <input
      disabled={isDisabled}
      type="radio"
      checked={isChecked}
      onChange={onChange}
    />
    <SvgIcon
      path={icon}
      style={{
        flex: '0 0 1rem',
        width: '1rem',
        height: '1rem',
        fill: 'currentColor',
        display: 'inline',
        verticalAlign: 'sub',
        margin: '0 0.25rem',
        opacity: isDisabled ? 0.5 : 1,
        pointerEvents: isDisabled ? 'none' : 'auto',
      }}
     />
    {width >= CHART_LABEL_WIDTH_THRESHOLD && (
      <span>{label}</span>
    )}
  </label>
);

const RecordButton = Hoverable(
  ({ isActive, isHovered, onClick, onMouseEnter, onMouseLeave, theme }) => (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        background: 'none',
        border: 'none',
        outline: 'none',
        cursor: 'pointer',
        color: isActive
          ? theme.special03
          : isHovered ? theme.state06 : theme.base05,
        filter: isActive
          ? `drop-shadow( 0 0 2px ${theme.special03} )`
          : 'none',
        padding: '4px',
      }}
      title={isActive ? 'Stop profiling' : 'Start profiling'}
    >
      <SvgIcon
        path={Icons.RECORD}
        style={{
          flex: '0 0 1rem',
          width: '1rem',
          height: '1rem',
          fill: 'currentColor',
          display: 'inline',
          verticalAlign: 'sub',
        }}
      />
    </button>
  )
);
