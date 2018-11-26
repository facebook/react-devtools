/* globals chrome */

document.addEventListener('DOMContentLoaded', function() {
  // Add canary message
  const commitShaIndex = location.search.indexOf('commitSha=');
  if (commitShaIndex >= 0) {
    const commitSha = location.search.substr(commitShaIndex + 10);

    const link = document.createElement('a');
    link.href = `https://github.com/facebook/react/commit/${commitSha}`;
    link.text = commitSha;

    const paragraph = document.createElement('p');
    paragraph.appendChild(document.createTextNode('This page is using a canary version that was created from commit '));
    paragraph.appendChild(link);
    paragraph.appendChild(document.createTextNode('.'));

    document.body.appendChild(document.createElement('hr'));
    document.body.appendChild(paragraph);
  }

  // Make links work
  const links = document.getElementsByTagName('a');
  for (let i = 0; i < links.length; i++) {
    (function() {
      const link = links[i];
      const location = link.href;
      link.onclick = function(event) {
        event.preventDefault();
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
