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

import type {Theme} from '../../frontend/types';

var React = require('react');
var decorate = require('../../frontend/decorate');
var {sansSerif} = require('../../frontend/Themes/Fonts');
const SvgIcon = require('../../frontend/SvgIcon');
const Icons = require('../../frontend/Icons');
const Hoverable = require('../../frontend/Hoverable');

type Props = {|
  isRecording: boolean,
  toggleIsRecording: Function,
|};

class ProfilerTab extends React.Component<Props> {
  static contextTypes = {
    theme: React.PropTypes.object.isRequired,
  };

  render() {
    const { theme } = this.context;
    const { isRecording, toggleIsRecording } = this.props;
    return (
      <div style={styles.container}>
        Click the record button <RecordButton
          isActive={isRecording}
          onClick={toggleIsRecording}
          theme={theme}
        /> to start a new recording.
      </div>
    );
  }
}

const RecordButton = Hoverable(
  ({ isActive, isHovered, onClick, onMouseEnter, onMouseLeave, theme }) => (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={recordButtonStyle(isActive, isHovered, theme)}
      title={isActive
        ? 'Stop recording'
        : 'Record profiling information'
      }
    >
      <SvgIcon path={Icons.RECORD} />
    </button>
  )
);

var styles = {
  container: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: sansSerif.family,
    fontSize: sansSerif.sizes.normal,
  },
};

const recordButtonStyle = (isActive: boolean, isHovered: boolean, theme: Theme) => ({
  display: 'flex',
  background: 'none',
  border: 'none',
  outline: 'none',
  color: isActive
    ? theme.special03
    : isHovered ? theme.state06 : 'inherit',
  filter: isActive
    ? `drop-shadow( 0 0 2px ${theme.special03} )`
    : 'none',
});

module.exports = decorate({
  store: 'profilerStore',
  listeners: () => ['isRecording'],
  props(store) {
    return {
      isRecording: !!store.isRecording,
      toggleIsRecording: () => store.setIsRecording(!store.isRecording),
    };
  },
}, ProfilerTab);
