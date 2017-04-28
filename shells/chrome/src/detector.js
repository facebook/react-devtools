/* global chrome */
function detect() {
  setTimeout(() => {
    const selector = '[data-reactroot], [data-reactid]';
    const runningReact = !!document.querySelector(selector);
    if (runningReact) {
      chrome.runtime.sendMessage({
        runningReact: true,
      });
    }
  }, 100);
}

detect();
