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

import React, {Fragment} from 'react';
import {monospace} from '../../../frontend/Themes/Fonts';
import DataView from '../../../frontend/DataView/DataView';
import DetailPane from '../../../frontend/detail_pane/DetailPane';
import DetailPaneSection from '../../../frontend/detail_pane/DetailPaneSection';
import Icons from '../../../frontend/Icons';
import IconButton from './IconButton';

const emptyFunction = () => {};

type Props = {|
  isInspectingSelectedFiber: boolean,
  name?: string,
  selectedChartType: ChartType,
  snapshot: Snapshot,
  snapshotFiber: any,
  theme: Theme,
  toggleInspectingSelectedFiber: Function,
|};

const ProfilerFiberDetailPane = ({
  isInspectingSelectedFiber,
  name = 'Unknown',
  selectedChartType,
  snapshot,
  snapshotFiber,
  theme,
  toggleInspectingSelectedFiber,
}: Props) => (
  <Fragment>
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.25rem',
      backgroundColor: theme.base01,
      borderBottom: `1px solid ${theme.base03}`,
      boxSizing: 'border-box',
    }}>
      <div
        style={{
          fontFamily: monospace.family,
          fontSize: monospace.sizes.large,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={name}
      >
        {name}
      </div>
      <IconButton
        icon={
          isInspectingSelectedFiber
            ? selectedChartType === 'flamegraph'
              ? Icons.FLAME_CHART
              : Icons.RANKED_CHART
            : Icons.BARS
        }
        onClick={toggleInspectingSelectedFiber}
        theme={theme}
        title={`Inspect ${name}`}
      />
    </div>
    {snapshotFiber !== null && (
      <div style={{
        flex: 1,
        overflow: 'auto',
      }}>
        <DetailPane theme={theme}>
          <DetailPaneSection title="Props">
            <DataView
              path={['props']}
              readOnly={true}
              inspect={emptyFunction}
              showMenu={emptyFunction}
              data={snapshotFiber.get('props')}
            />
          </DetailPaneSection>
          {snapshotFiber.get('state') && (
            <DetailPaneSection title="State">
              <DataView
                path={['state']}
                readOnly={true}
                inspect={emptyFunction}
                showMenu={emptyFunction}
                data={snapshotFiber.get('state')}
              />
            </DetailPaneSection>
          )}
        </DetailPane>
      </div>
    )}
  </Fragment>
);

export default ProfilerFiberDetailPane;
