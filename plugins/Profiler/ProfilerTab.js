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

const PropTypes = require('prop-types');

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

class ProfilerTab extends React.Component<Props, void> {
  static contextTypes = {
    theme: PropTypes.object.isRequired,
  };

  render() {
    const { theme } = this.context;
    const { isRecording, toggleIsRecording } = this.props;

    const profilingData = null; // TODO Read from Store/props

    let content;
    if (isRecording) {
      content = (
        <RecordingInProgress theme={theme} stopRecording={toggleIsRecording} />
      );
    } else if (profilingData) {
      // TODO
    } else {
      content = (
        <InactiveNoData startRecording={toggleIsRecording} theme={theme} />
      );
    }

    return (
      <div style={styles.container}>
        {content}
      </div>
    );
  }
}

const InactiveNoData = ({startRecording, theme}) => (
  <span style={styles.row}>
    Click the record button <RecordButton
      isActive={false}
      onClick={startRecording}
      theme={theme}
    /> to start a new recording.
  </span>
);

const RecordingInProgress = ({stopRecording, theme}) => (
  <span style={styles.column}>
    Recording profiling data...
    <button
      onClick={stopRecording}
      style={stopRecordingButtonStyle(theme)}
      title="Stop recording"
    >
      Stop
    </button>
  </span>
);

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
  column: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

const recordButtonStyle = (isActive: boolean, isHovered: boolean, theme: Theme) => ({
  background: 'none',
  border: 'none',
  outline: 'none',
  cursor: 'pointer',
  color: isActive
    ? theme.special03
    : isHovered ? theme.state06 : 'inherit',
  filter: isActive
    ? `drop-shadow( 0 0 2px ${theme.special03} )`
    : 'none',
});

const stopRecordingButtonStyle = (theme: Theme) => ({
  display: 'flex',
  background: theme.state00,
  border: 'none',
  outline: 'none',
  cursor: 'pointer',
  color: theme.base00,
  padding: '.5rem 0.75rem',
  marginTop: '0.5rem',
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
