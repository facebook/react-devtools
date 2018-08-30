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
import type {Snapshot} from '../ProfilerTypes';

import React, {Fragment} from 'react';
import {monospace} from '../../../frontend/Themes/Fonts';
import DataView from '../../../frontend/DataView/DataView';
import DetailPane from '../../../frontend/detail_pane/DetailPane';
import DetailPaneSection from '../../../frontend/detail_pane/DetailPaneSection';
import Icons from '../../../frontend/Icons';
import IconButton from './IconButton';

const emptyFunction = () => {};

type Props = {|
  deselectFiber: Function,
  isInspectingSelectedFiber: boolean,
  name?: string,
  snapshot: Snapshot,
  snapshotFiber: any,
  theme: Theme,
  toggleInspectingSelectedFiber: Function,
|};

const ProfilerFiberDetailPane = ({
  deselectFiber,
  isInspectingSelectedFiber,
  name = 'Unknown',
  snapshot,
  snapshotFiber,
  theme,
  toggleInspectingSelectedFiber,
}: Props) => (
  <Fragment>
    <div style={{
      height: '2rem',
      lineHeight: '2rem',
      backgroundColor: theme.base01,
      borderBottom: `1px solid ${theme.base03}`,
    }}>
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '0.25rem',
        boxSizing: 'border-box',
      }}>
        <div
          style={{
            fontFamily: monospace.family,
            fontSize: monospace.sizes.large,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: '1 1 auto',
          }}
          title={name}
        >
          {name}
        </div>
        <IconButton
          disabled={isInspectingSelectedFiber}
          icon={Icons.BARS}
          onClick={toggleInspectingSelectedFiber}
          style={{
            backgroundColor: theme.state00,
            color: theme.base00,
            flex: '0 0 auto',
          }}
          theme={theme}
          title={`Inspect ${name}`}
        />
        <IconButton
          icon={Icons.CLOSE}
          onClick={isInspectingSelectedFiber ? toggleInspectingSelectedFiber : deselectFiber}
          style={{
            marginLeft: '0.25rem',
            backgroundColor: theme.base03,
            color: theme.base05,
            flex: '0 0 auto',
          }}
          theme={theme}
          title="Close"
        />
      </div>
    </div>
    {snapshotFiber !== null && (
      <div style={{
        flex: 1,
        overflow: 'auto',
      }}>
        <div style={{
          padding: '0.25rem',
          fontSize: monospace.sizes.normal,
          fontFamily: monospace.family,
        }}>
          <strong>Total renders</strong>: {snapshotFiber.get('renders')}
        </div>
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
