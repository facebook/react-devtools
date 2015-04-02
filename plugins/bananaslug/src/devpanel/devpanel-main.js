// devpanels.

var UserDefaultSetting = require('../share/UserDefaultSetting');
var Logger = require('../share/Logger');
var constants = require('../share/constants');

var {
  chrome,
  document,
  localStorage,
} = global;

var DEBUG_MODE = true;

var _logger = DEBUG_MODE ? new Logger() : null;
var _setting = UserDefaultSetting.getInstance('devpanel');

function log() {
  if (DEBUG_MODE) {
    _logger.log.apply(_logger, arguments);
  }
}

/**
 * @param {boolean} enabled
 */
function notifyIsEnabled(enabled) {
  var method = constants.GLOBAL_INJECTED_METHOD_SET_ENABLED_NAME;
  var code = `
    try {
      window["${method}"](${enabled});
    } catch (error) {
      console.error(error);
    }
  `;

  try {
    chrome.devtools.inspectedWindow.eval(code);
  } catch (ex) {
    log(ex.message, 'devpanel error');
  }


  try {
    _setting.setDefaultEnabled(enabled);
    var msg = JSON.stringify(localStorage, null, '  ').replace(/\'/g, '\\\'');
    log(msg);
    // _setting = UserDefaultSetting.getInstance('devpanel');
    // _setting.setDefaultEnabled(enabled);
  } catch (ex) {
    log(ex.message, 'devpanel error');
  }

  return true;
}

function main() {
  var enabled;

  try {
    enabled = _setting.isDefaultEnabled();
  } catch (ex) {
    log(ex.message, 'devpanel error');
    return;
  }

  var checkbox = document.getElementById('checkbox');
  checkbox.checked = enabled;

  checkbox.addEventListener(
    'change',
    () => notifyIsEnabled(checkbox.checked),
    true
  );

  notifyIsEnabled(enabled);
  log('devpanel started');
}

main();

