
var a = 23;
global.complex = [{a:2}, {1:{2:{3:{}}}}];

function b(){ 
  console.log('in b');
  c(0);
}

setTimeout(function () {
console.log('global.thing');
console.log(global.thing);
  console.log('awesome');
}, 100);

var MAX = 20;

function c(i) {
  i = i || 0;
  console.log('in c', i);
  if (i > MAX) {
    console.log('done');
    return;
  }
  setTimeout(function () {
    d(i);
  }, 1500);
}

function d(i) {
  console.log(d, i);
  c(i+1);
}

b();

console.log('end');
