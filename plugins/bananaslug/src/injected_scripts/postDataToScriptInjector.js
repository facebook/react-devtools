/**
 * @fileOverview
 * This file is injected into thw native web page.
 */

/**
 * @param {string} type
 * @param {*} data
 */
function postDataToScriptInjector(type, data) {
  window.postMessage(
    JSON.stringify({
      accesstoken: '__ACCESS_TOKEN__',
      type: type,
      data: data,
    }),
    '*'
  );
};

module.exports = postDataToScriptInjector;

