
module.exports = function (scriptName, done) {
  var src = `
  var script = document.constructor.prototype.createElement.call(document, 'script');
  script.src = "${scriptName}";
  document.documentElement.appendChild(script);
  script.parentNode.removeChild(script);
  /*
  var frame = document.constructor.prototype.createElement.call(document, 'iframe');
  frame.className = 'react-devtools-reporter';
  frame.src = "${23}";
  document.head.appendChild(frame);
  */
  `;

  chrome.devtools.inspectedWindow.eval(src, function (res, err) {
    console.log(err);
    done();
  })
}

