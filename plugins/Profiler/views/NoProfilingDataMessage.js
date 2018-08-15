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

import React, {Fragment} from 'react';
import Icons from '../../../frontend/Icons';
import SvgIcon from '../../../frontend/SvgIcon';
import {sansSerif} from '../../../frontend/Themes/Fonts';

type Props = {|
  hasMultipleRoots: boolean,
  startRecording: Function,
  theme: Theme,
|};

export default ({ hasMultipleRoots, startRecording, theme }: Props) => {
  let buttonPreMessage;
  let headerText;
  if (hasMultipleRoots) {
    buttonPreMessage = (
      <Fragment>
        Select a different root in the <strong>Elements</strong> panel, or click the record button
      </Fragment>
    );
    headerText = 'No profiling data has been recorded for the selected root.';
  } else {
    buttonPreMessage = (
      <Fragment>
        Click the record button
      </Fragment>
    );
    headerText = 'No profiling data has been recorded.';
  }

  return (
    <div
      style={{
        height: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <p style={{
        fontSize: sansSerif.sizes.large,
      }}>
        {headerText}
      </p>
      <p>
        {buttonPreMessage}
        <button
          onClick={startRecording}
          style={{
            display: 'inline-block',
            background: theme.base01,
            outline: 'none',
            cursor: 'pointer',
            color: theme.base05,
            padding: '.5rem',
            margin: '0 0.25rem',
            border: `1px solid ${theme.base03}`,
          }}
          title="Start recording"
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
        to start a new recording.
      </p>
    </div>
  );
};
