/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var {
  localStorage,
} = global;

class UserDefaultSettingClass {
  /**
   * @param {string} location
   */
  constructor(location) {
    this._key = `_BANANASLUG_DEFAULT_SETTING.${location}`;
    this._enabled = undefined;
  }

  /**
   * @param {boolean} enabled
   * @return {boolean}
   */
  setDefaultEnabled(enabled) {
    if (enabled === this._enabled) {
      return true;
    }

    if (enabled) {
      try {
        localStorage.setItem(this._key, '1');
      } catch (ex) {
        return false;
      }
    } else {
      try {
        localStorage.setItem(this._key, '0');
      } catch (ex) {
        return false;
      }
    }
    this._enabled = enabled;
    return true;
  }

  /**
   * @return {boolean}
   */
  isDefaultEnabled() {
    try {
      var value = String(localStorage.getItem(this._key));
      if (value === '1') {
        return true;
      } else {
        // default value is false;
        this.setDefaultEnabled(false);
        return false;
      }
    } catch (ex) {
      return false;
    }
  }
}

var _instances = {};

var UserDefaultSetting = {
  /**
   * @param {string} location
   * @return {UserDefaultSettingClass}
   */
  getInstance(location) {
    if (!_instances.hasOwnProperty(location)) {
      _instances[location] = new UserDefaultSettingClass(location);
      return _instances[location];
    }
    return _instances[location];
  }
};
module.exports = UserDefaultSetting;
