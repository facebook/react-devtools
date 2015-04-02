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
        localStorage.removeItem(KEY_ENABLED);
      } catch (ex) {
        return false;
      }
    }
  },

  isDefaultEnabled() {
    try {
      return !!localStorage.getItem(KEY_ENABLED);
    } catch (ex) {
      // default.
      return true;
    }
    return true;
  },
};

module.exports = UserDefaultSetting;
