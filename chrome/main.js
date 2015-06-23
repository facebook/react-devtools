
chrome.devtools.inspectedWindow.eval(`!!(
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__._reactRuntime ||
  window.__REACT_DEVTOOLS_BACKEND__.injectDevTools
)`, function (res, err) {
  if (!res) {
    return;
  }
  chrome.devtools.panels.create('NReact', '', 'panel.html', function () {
  });
});

