/* globals chrome */

document.addEventListener('DOMContentLoaded', function() {
  // Make links work
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

  // Work around https://bugs.chromium.org/p/chromium/issues/detail?id=428044
  document.body.style.opacity = 0;
  document.body.style.transition = 'opacity ease-out .4s';
  requestAnimationFrame(function() {
    document.body.style.opacity = 1;
  });
});
