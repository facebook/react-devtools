document.addEventListener('DOMContentLoaded', function() {
  // Work around https://bugs.chromium.org/p/chromium/issues/detail?id=428044
  document.body.style.opacity = 0;
  document.body.style.transition = 'opacity ease-out .4s';
  requestAnimationFrame(function() {
    document.body.style.opacity = 1;
  });
});
