
module.exports = function (done) {
  chrome.devtools.inspectedWindow.eval(`!!(
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__._reactRuntime ||
    window.__REACT_DEVTOOLS_BACKEND__.injectDevTools
  )`, function (res, err) {
    done(res);
  });
}

