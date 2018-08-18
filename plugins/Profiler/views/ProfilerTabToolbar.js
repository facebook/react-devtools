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
import SnapshotSelector from './SnapshotSelector';

const CHART_RADIO_LABEL_WIDTH_THRESHOLD = 650;
const CHART_NATIVE_NODES_TOGGLE_LABEL_WIDTH_THRESHOLD = 800;

type SelectSnapshot = (snapshot: Snapshot) => void;

type Props = {|
  interactionsCount: number,
  isInspectingSelectedFiber: boolean,
  isRecording: boolean,
  selectChart: (chart: ChartType) => void,
  selectedChartType: ChartType,
  selectedFiberID: string | null,
  selectedSnapshot: Snapshot,
  selectSnapshot: SelectSnapshot,
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
  interactionsCount: number,
  isInspectingSelectedFiber: boolean,
  isRecording: boolean,
  selectChart: (chart: ChartType) => void,
  selectedChartType: ChartType,
  selectedFiberID: string | null,
  selectedSnapshot: Snapshot,
  selectSnapshot: SelectSnapshot,
  showNativeNodes: boolean,
  snapshotIndex: number,
  snapshots: Array<Snapshot>,
  theme: Theme,
  toggleIsRecording: Function,
  toggleShowNativeNodes: Function,
  width: number,
};

const ProfilerTabToolbar = ({
  interactionsCount,
  isInspectingSelectedFiber,
  isRecording,
  selectChart,
  selectedChartType,
  selectedFiberID,
  selectedSnapshot,
  selectSnapshot,
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

        <ShowNativeNodesButton
          isActive={showNativeNodes}
          onClick={toggleShowNativeNodes}
          theme={theme}
          width={width}
        />

        <HRule theme={theme} />

        <SnapshotSelector
          isInspectingSelectedFiber={isInspectingSelectedFiber}
          selectedFiberID={selectedFiberID}
          selectedSnapshot={selectedSnapshot}
          selectSnapshot={selectSnapshot}
          snapshotIndex={snapshotIndex}
          snapshots={snapshots}
          theme={theme}
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
      pointerEvents: isDisabled ? 'none' : 'auto',
    }}
    title={label}
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
      }}
     />
    {width >= CHART_RADIO_LABEL_WIDTH_THRESHOLD && (
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

type ShowNativeNodesButtonProps = {|
  isActive: boolean,
  isHovered: boolean,
  onClick: Function,
  onMouseEnter: Function,
  onMouseLeave: Function,
  theme: Theme,
  width: number,
|};

const ShowNativeNodesButton = Hoverable(({
  isActive,
  isDisabled,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
  theme,
  width,
}: ShowNativeNodesButtonProps) => (
  <label
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    style={{
      display: 'flex',
      alignItems: 'center',
      color: isHovered ? theme.state06 : 'inherit',
      cursor: 'pointer',
    }}
    title="Show native elements?"
  >
    <input
      type="checkbox"
      checked={isActive}
      onChange={onClick}
    />
    <SvgIcon
      path={Icons.DOM_ELEMENT}
      style={{
        flex: '0 0 1rem',
        width: '1rem',
        height: '1rem',
        fill: 'currentColor',
        display: 'inline',
        verticalAlign: 'sub',
        margin: '0 0.25rem',
      }}
     />
     {width >= CHART_NATIVE_NODES_TOGGLE_LABEL_WIDTH_THRESHOLD ? 'Show native nodes?' : ''}
  </label>
));
