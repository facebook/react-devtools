
window.addEventListener('message', function (evt) {
  var debuggee = evt.ports[0];
  console.log('panel got', debuggee);
  document.body.innerHTML = 'got debuggee';
});

console.log('awesome');
document.body.innerHTML = 'one';

