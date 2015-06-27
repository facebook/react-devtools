
module.exports = function (scriptName, done) {
  var src = `
  var script = document.constructor.prototype.createElement.call(document, 'script');
  script.src = "${scriptName}";
  document.documentElement.appendChild(script);
  script.parentNode.removeChild(script);
  `;

  chrome.devtools.inspectedWindow.eval(src, function (res, err) {
    if (err) {
      console.log(err);
    }
    done();
  })
}

