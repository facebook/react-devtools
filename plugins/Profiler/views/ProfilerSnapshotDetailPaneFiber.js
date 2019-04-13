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

import React from 'react';
import {monospace, sansSerif} from '../../../frontend/Themes/Fonts';
import DataView from '../../../frontend/DataView/DataView';
import DetailPane from '../../../frontend/detail_pane/DetailPane';
import DetailPaneSection from '../../../frontend/detail_pane/DetailPaneSection';

const emptyFunction = () => {};

type Props = {|
  snapshotFiber: any,
  theme: Theme,
|};

const ProfilerSnapshotDetailPaneFiber = ({
  snapshotFiber,
  theme,
}: Props) => {
  const containsHooks = snapshotFiber.get('containsHooks');
  const props = snapshotFiber.get('props');
  const renders = snapshotFiber.get('renders');
  const state = snapshotFiber.get('state');

  return (
    <div style={{
      flex: 1,
      overflow: 'auto',
    }}>
      <div style={{
        padding: '0.25rem',
        fontSize: monospace.sizes.normal,
        fontFamily: monospace.family,
      }}>
        <strong>Total renders</strong>: {renders}
      </div>
      <DetailPane theme={theme}>
        <DetailPaneSection title="Props">
          <DataView
            path={['props']}
            readOnly={true}
            inspect={null}
            showMenu={emptyFunction}
            startOpen={true}
            data={props}
          />
        </DetailPaneSection>

        {state && containsHooks && (
          <DetailPaneSection title="Hooks">
            <div style={{
              lineHeight: '1.25rem',
              marginLeft: '1rem',
              fontFamily: sansSerif.family,
              fontSize: sansSerif.sizes.normal,
            }}>
              Not available in profiling mode.
            </div>
          </DetailPaneSection>
        )}

        {state && !containsHooks && (
          <DetailPaneSection title="State">
            <DataView
              path={['state']}
              readOnly={true}
              inspect={null}
              showMenu={emptyFunction}
              startOpen={true}
              data={state}
            />
          </DetailPaneSection>
        )}
      </DetailPane>
    </div>
  );
};

export default ProfilerSnapshotDetailPaneFiber;
