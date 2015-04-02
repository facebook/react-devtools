/**
 * Copyright (c) 2013-2014, Facebook, Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *  * Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 *  * Neither the name Facebook nor the names of its contributors may be used to
 *    endorse or promote products derived from this software without specific
 *    prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
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
