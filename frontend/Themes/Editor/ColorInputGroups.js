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

const React = require('react');
const ColorInput = require('./ColorInput');

import type {Theme} from '../../types';

type Props = {
  customTheme: Theme,
  descriptions: {[key: string]: string},
  label: string,
  theme: Theme,
  udpatePreview: () => void,
};

const ColorInputGroups = ({ customTheme, descriptions, label, theme, udpatePreview }: Props) => (
  <div>
    <label style={labelStyle(theme)}>{label}</label>
    <div style={styles.group}>
      {Object.keys(descriptions).map(key => (
        <ColorInput
          customTheme={customTheme}
          key={key}
          label={descriptions[key]}
          propertyName={key}
          udpatePreview={udpatePreview}
          theme={theme}
        />
      ))}
    </div>
  </div>
);

const labelStyle = (theme: Theme) => ({
  display: 'inline-block',
  marginBottom: '0.25rem',
  fontWeight: 'bold',
  color: theme.special05,
});

const styles = {
  group: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: '-0.25rem',
  },
};

module.exports = ColorInputGroups;
