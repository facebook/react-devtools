/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

import PropTypes from 'prop-types';
import React, {Component, createRef} from 'react';
import {findDOMNode} from 'react-dom';
import SvgIcon from './SvgIcon';
import Icons from './Icons';
import decorate from './decorate';
import styles from './SettingsPane.css';

type EventLike = {
  keyCode: number,
  target: Node,
  preventDefault: () => void,
  stopPropagation: () => void,
};

class SettingsPane extends Component {
  input = createRef();
  state = {focused: false};

  componentDidMount() {
    const doc = findDOMNode(this).ownerDocument;
    // capture=true is needed to prevent chrome devtools console popping up
    doc.addEventListener('keydown', this.onDocumentKeyDown, true);
  }

  componentWillUnmount() {
    const doc = findDOMNode(this).ownerDocument;
    doc.removeEventListener('keydown', this.onDocumentKeyDown, true);
  }

  onDocumentKeyDown = (event: EventLike) => {
    if (
      event.keyCode === 191 && // forward slash
      event.target.nodeName !== 'INPUT' &&
      !event.target.isContentEditable &&
      this.input.current
    ) {
      this.input.current.focus();
      event.preventDefault();
    }
    if (event.keyCode === 27) { // escape
      if (!this.props.searchText && !this.state.focused) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      this.cancel();
    }
  };

  cancel() {
    this.props.onChangeSearch('');
    if (this.input.current) {
      this.input.current.blur();
    }
  }

  onKeyDown(key) {
    if (key === 'Enter' && this.input.current) {
      // switch focus to tree view
      this.input.current.blur();
      this.props.selectFirstSearchResult();
    }
  }

  render() {
    const searchText = this.props.searchText;

    return (
      <div className={styles.SettingsPane}>
        {this.context.showInspectButton && (
          <button
            className={this.props.isInspectEnabled ? styles.ActiveInspectMenuButton : styles.InspectMenuButton}
            onClick={this.props.toggleInspectEnabled}
            title="Select a React element in the page to inspect it"
          >
            <SvgIcon path={Icons.INSPECT} />
          </button>
        )}

        <div className={styles.SearchInputWrapper}>
          <input
            ref={this.input}
            className={styles.Input}
            value={searchText}
            onFocus={() => this.setState({focused: true})}
            onBlur={() => this.setState({focused: false})}
            onKeyDown={e => this.onKeyDown(e.key)}
            placeholder="Search (text or /regex/)"
            onChange={e => this.props.onChangeSearch(e.target.value)}
            title="Search by React component name or text"
          />
          <SvgIcon className={styles.SearchIcon} path={Icons.SEARCH} />
          {!!searchText && (
            <div
              className={styles.ClearSearchButton}
              onClick={this.cancel.bind(this)}
            >
              &times;
            </div>
          )}
        </div>

        <button
          className={styles.SettingsMenuButton}
          onClick={this.props.showPreferencesPanel}
          title="Customize React DevTools"
        >
          <SvgIcon path={Icons.SETTINGS} />
        </button>
      </div>
    );
  }
}

SettingsPane.contextTypes = {
  showInspectButton: PropTypes.bool.isRequired,
};
SettingsPane.propTypes = {
  isInspectEnabled: PropTypes.bool,
  isRecording: PropTypes.bool,
  searchText: PropTypes.string,
  selectFirstSearchResult: PropTypes.func,
  toggleRecord: PropTypes.func,
  onChangeSearch: PropTypes.func,
  toggleInspectEnabled: PropTypes.func,
};

const Wrapped = decorate({
  listeners(props) {
    return ['isInspectEnabled', 'isRecording', 'searchText'];
  },
  props(store) {
    return {
      isInspectEnabled: store.isInspectEnabled,
      isRecording: store.isRecording,
      onChangeSearch: text => store.changeSearch(text),
      searchText: store.searchText,
      selectFirstSearchResult: store.selectFirstSearchResult.bind(store),
      showPreferencesPanel() {
        store.showPreferencesPanel();
      },
      toggleInspectEnabled: () => store.setInspectEnabled(!store.isInspectEnabled),
      toggleRecord: () => store.setIsRecording(!store.isRecording),
    };
  },
}, SettingsPane);

export default Wrapped;
