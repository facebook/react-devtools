var {
  localStorage,
} = global;

class UserDefaultSettingClass {
  /**
   * @param {string} location
   */
  constructor(location) {
    this._key = `__BANANASLUG_DEFAULT_SETTING.${location}`;
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
