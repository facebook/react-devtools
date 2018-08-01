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
import type {ChartType, Snapshot} from '../ProfilerTypes';

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
  selectChart: (chart: ChartType) => void,
  selectNextSnapshotIndex: Function,
  selectPreviousSnapshotIndex: Function,
  selectedChartType: ChartType,
  showNativeNodes: boolean,
  snapshotIndex: number,
  snapshots: Array<Snapshot>,
  theme: Theme,
  toggleIsRecording: Function,
  toggleShowNativeNodes: Function,
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
  selectChart: (chart: ChartType) => void,
  selectNextSnapshotIndex: Function,
  selectPreviousSnapshotIndex: Function,
  selectedChartType: ChartType,
  showNativeNodes: boolean,
  snapshotIndex: number,
  snapshots: Array<Snapshot>,
  theme: Theme,
  toggleIsRecording: Function,
  toggleShowNativeNodes: Function,
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
  selectedChartType,
  showNativeNodes,
  snapshotIndex,
  snapshots,
  theme,
  toggleIsRecording,
  toggleShowNativeNodes,
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
        <RadioOption
          icon={Icons.FLAME_CHART}
          isChecked={selectedChartType === 'flamegraph'}
          isDisabled={isInspectingSelectedFiber}
          label="Flamegraph"
          onChange={() => selectChart('flamegraph')}
          theme={theme}
          width={width}
        />
        &nbsp;
        <RadioOption
          icon={Icons.RANKED_CHART}
          isChecked={selectedChartType === 'ranked'}
          isDisabled={isInspectingSelectedFiber}
          label="Ranked"
          onChange={() => selectChart('ranked')}
          theme={theme}
          width={width}
        />
        &nbsp;
        <RadioOption
          icon={Icons.INTERACTION}
          isChecked={selectedChartType === 'interactions'}
          isDisabled={isInspectingSelectedFiber}
          label={`Interactions (${interactionsCount})`}
          onChange={() => selectChart('interactions')}
          theme={theme}
          width={width}
        />

        <div style={{flex: 1}} />

        <label
          style={{
            opacity: isInspectingSelectedFiber ? 0.5 : 1,
          }}
        >
          <IconButton
            disabled={isInspectingSelectedFiber}
            icon={Icons.DOM_ELEMENT}
            isActive={showNativeNodes}
            isTransparent={true}
            onClick={toggleShowNativeNodes}
            theme={theme}
            title="Show native elements?"
          />
        </label>

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

type RadioOptionProps = {|
  icon: string,
  isChecked: boolean,
  isDisabled: boolean,
  label: string,
  isHovered: boolean,
  onChange: Function,
  onMouseEnter: Function,
  onMouseLeave: Function,
  theme: Theme,
  width: number,
|};

const RadioOption = Hoverable(({
  icon,
  isChecked,
  isDisabled = false,
  isHovered,
  label,
  onChange,
  onMouseEnter,
  onMouseLeave,
  theme,
  width,
}: RadioOptionProps) => (
  <label
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    style={{
      color: isHovered ? theme.state06 : 'inherit',
      marginRight: '0.5rem',
      cursor: 'pointer',
      opacity: isDisabled ? 0.5 : 1,
    }}
  >
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
        pointerEvents: isDisabled ? 'none' : 'auto',
      }}
     />
    {width >= CHART_LABEL_WIDTH_THRESHOLD && (
      <span>{label}</span>
    )}
  </label>
));

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
