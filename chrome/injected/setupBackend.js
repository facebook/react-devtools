
// This script runs before the <head> element is created, so we add the script
// to <html> instead.
var script = document.createElement('script');
script.src = chrome.runtime.getURL('build/backend.js');
document.documentElement.appendChild(script);
script.parentNode.removeChild(script);

