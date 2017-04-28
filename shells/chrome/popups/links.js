/* globals chrome */

document.addEventListener('DOMContentLoaded', function() {
  var links = document.getElementsByTagName('a');
  for (var i = 0; i < links.length; i++) {
    (function() {
      var ln = links[i];
      var location = ln.href;
      ln.onclick = function() {
        chrome.tabs.create({active: true, url: location});
      };
    })();
  }
});
