var {
  localStorage,
} = global;

var KEY_ENABLED = '__bananaslug_is_default_enabled';

var UserDefaultSetting = {
  setDefaultEnabled(enabled) {
    if (enabled) {
      try {
        localStorage.setItem(KEY_ENABLED, '1');
      } catch (ex) {
        return false;
      }
    } else {
      try {
        localStorage.setItem(KEY_ENABLED, '0');
      } catch (ex) {
        return false;
      }
    }
  },

  isDefaultEnabled() {
    try {
      return String(localStorage.getItem(KEY_ENABLED)) !== '0';
    } catch (ex) {
      // default.
      return true;
    }
    return true;
  },
};

module.exports = UserDefaultSetting;
