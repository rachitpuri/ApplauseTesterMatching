var express = require('express');
var app = express();
var port = process.env.port || 4000

app.get('/', function (req, res) {
    res.send('Hello World!');
});

var server = app.listen(port, function () {
    var host = server.address().address || '127.0.0.1';
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});