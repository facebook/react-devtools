/**
 * Serialize an object, but only simple types, and only one level deep. All
 * other things get replaced with an ID.
 */

module.exports = function weakCereal(object, depth) {
  var result = {};
  for (var name in object) {
    if (issimple(object[name])) {
      result[name] = JSON.stringify(object[name]);
    } else if ('function' === typeof object[name]) {
      result[name] = '' + object[name];
    } else if (depth > 1) {
      result[name] = weakCereal(object[name], depth - 1);
    } else {
      result[name] = previewObject(object[name]);
    }
  }
  return result;
}

function isSimple(obj) {
  return ['string', 'number'].indexOf(typeof obj) !== -1;
}

function previewObject(obj) {
  return '{}';
}

