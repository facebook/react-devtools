// devpanels.

var UserDefaultSetting = require('../share/UserDefaultSetting');
var constants = require('../share/constants');

var {
  chrome,
  document,
} = global;

var _enabled;

/**
 * @param {boolean} enabled
 */
function notifyIsEnabled(enabled) {
  _enabled = enabled;

  var method = constants.GLOBAL_INJECTED_METHOD_SET_ENABLED_NAME;
  var code = `
    try {
      window["${method}"](${enabled});
    } catch (error) {
      console.error(error);
    }`;
  chrome.devtools.inspectedWindow.eval(code);
  return true;
}

function main() {
  notifyIsEnabled(UserDefaultSetting.isDefaultEnabled());

  var checkbox = document.getElementById('checkbox');
  checkbox.checked = _enabled;

  checkbox.addEventListener(
    'change',
    () => notifyIsEnabled(checkbox.checked),
    true
  );
}

main();

