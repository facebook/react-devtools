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

const {sansSerif} = require('./Themes/Fonts');

type Props = {
  isChecked: boolean,
  label: string,
  onChange: (isChecked: boolean) => void,
};

function SettingsCheckbox({ isChecked, label, onChange }: Props) {
  return (
    <label style={styles.container}>
      <input
        type="checkbox"
        style={styles.checkbox}
        checked={isChecked}
        onChange={() => onChange(!isChecked)}
      />
      {label}
    </label>
  );
}

var styles = {
  checkbox: {
    pointerEvents: 'none',
    marginRight: '5px',
  },
  container: {
    WebkitUserSelect: 'none',
    cursor: 'default',
    display: 'inline-block',
    outline: 'none',
    fontFamily: sansSerif.family,
    userSelect: 'none',
    marginRight: '10px',
  },
};

module.exports = SettingsCheckbox;
