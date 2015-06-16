
var Backend = require('./');

var backend = new Backend();
var inject = require('./inject');

inject(backend, window);

