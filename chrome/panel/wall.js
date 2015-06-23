
module.exports = function () {
  var backgroundPageConnection = chrome.runtime.connect({
    name: "devtools-page"
  });

  return {
    listen(fn) {
      backgroundPageConnection.onMessage.addListener(message => {
      });
    },
    send(data) {
      backgroundPageConnection.sendMessage({
        tabId: chrome.devtools.inspectedWindow.tabId,
        data,
      });
    },
  };
};
