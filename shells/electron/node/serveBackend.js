
var fs = require('fs');

function serveBackend(res) {
  fs.readFile(__dirname + '/../build/backend.js', function (err, data) {
    if (err) {
      console.error(err);
      res.writeHead(500);
      res.end('Failed to get file');
      return;
    }
    res.writeHead(200, {ContentType: 'text/plain'});
    res.end(data.toString('utf8'));
  });
}

module.exports = serveBackend;
