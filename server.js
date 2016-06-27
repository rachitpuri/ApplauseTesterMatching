"use strict"

// Load external packages
var express = require('express');
var bodyParser = require('body-parser');
var Sequelize = require('sequelize');
var fs = require('fs');
var parse = require('fast-csv');

var db = require('./lib/database/db');

// Express config
var app = express();
app.use(express.static(__dirname + '/'));

// Database setup
var config = {};
db(Sequelize, fs, parse, app, function (config) {
    // Load API modules
    require('./lib/index.js')(config.connect, app);
});

// --------------------------------- Testing Server --------------------------------------- //

app.get("/api/hello", function (req, res) {
    res.status(200).send('Hello');
})

// -------------------------------- start server --------------------------------------- //

var server;

var ip = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var port = process.env.OPENSHIFT_NODEJS_PORT || 4000;

app.listen(port, ip);

var start = exports.start = function start(ip, port, callback) {
    server = app.listen(port, ip, callback);
}

var stop = exports.stop = function stop(callback) {
    server.close(callback);
}

// ------------------------------------------------------------------------------------- //