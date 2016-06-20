"use strict"

var express = require('express');
var bodyParser = require('body-parser');
var Sequelize = require('sequelize');
var fs = require('fs');
var parse = require('fast-csv');

var app = express();
app.use(express.static(__dirname + '/'));

var PRODUCTION_DB = 'applause2'
var TEST_DB = 'testapplause'

var MODE_TEST = 'mode_test'
var MODE_PRODUCTION = 'mode_production'

var state = {
    pool: null,
    mode: null,
}

// connection
//connect(MODE_PRODUCTION);

var sequelize = new Sequelize(PRODUCTION_DB, 'root', 'siso@123', {
    host: '127.0.0.1',
    dialect: 'mysql',
    pool: false
    //pool: {
    //    max: 5,
    //    min: 0,
    //    idle: 10
    //},
});
state.mode = MODE_PRODUCTION;
state.pool = sequelize;

// ---------------------------------- Test DB connection -------------------------- //

sequelize
    .authenticate()
    .then(function (err) {
        console.log('Connection has been established successfully.');
    })
    .catch(function (err) {
        console.log('Unable to connect to the database:', err);
    });

// -------------------------------- Create Tables ---------------------------- //

// Tester Table
var Tester = sequelize.define('testers', {
    testerId: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    firstName: {
        type: Sequelize.STRING
    },
    lastName: {
        type: Sequelize.STRING
    },
    country: {
        type: Sequelize.STRING
    },
    lastLogin: {
        type: Sequelize.DATE
    }
}, {
    timestamps: false
});

// Devices Table
var Device = sequelize.define('devices', {
    deviceId: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    description: {
        type: Sequelize.STRING
    }
}, {
    timestamps: false
});


// Bugs Table
var Bug = sequelize.define('bugs', {
    bugId: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    deviceId: {
        type: Sequelize.INTEGER,
        references: {
            model: Device,
            key: 'deviceId'
        }
    },
    testerId: {
        type: Sequelize.INTEGER,
        references: {
            model: Tester,
            key: 'testerId'
        }
    },
    
}, {
    timestamps: false
});

// Tester_Device Table
var TesterDevice = sequelize.define('tester_devices', {
    testerId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
            model: Tester,
            key: 'testerId'
        }
    },
    deviceId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
            model: Device,
            key: 'deviceid'
        }
    }
}, {
    timestamps: false
});

// ------------------------------------- Pushing data into tables -------------------------------------------- //

Tester.sync({ force: true }).then(function () {
    fillTesterData("data/testers.csv", function () {
        Device.sync({ force: true }).then(function () {
            fillDeviceData("data/devices.csv", function () {
                Bug.sync({ force: true }).then(function () {
                    fillBugData("data/bugs.csv", function () {
                        TesterDevice.sync({ force: true }).then(function () {
                            fillTesterDeviceData("data/tester_device.csv", function () {
                            })
                        });
                    })
                });

            })
        });
    })
});


function fillTesterData(filename, callback) {
    // fill Testers database
    var tester_data = []
    parseCSV(filename, tester_data, function () {
        Tester.bulkCreate(tester_data).then(function () {
            callback();
            //return Tester.findAll();
        }).then(function (testers) {
            callback();
            //console.log(testers)
        });
    });
}

function fillDeviceData(filename, callback) {
    // fill Testers database
    var device_data = []
    parseCSV(filename, device_data, function () {
        Device.bulkCreate(device_data).then(function () {
            callback();
            //return Device.findAll();
        }).then(function (devices) {
            callback();
            //console.log(devices)
        });
    });
}

function fillBugData(filename, callback) {
    // fill Testers database
    var bug_data = []
    parseCSV(filename, bug_data, function () {
        Bug.bulkCreate(bug_data).then(function () {
            callback();
            //return Bug.findAll();
        }).then(function (bugs) {
            callback();
            //console.log(bugs)
        });
    });
}

function fillTesterDeviceData(filename, callback) {
    // fill Testers database
    var tester_device_data = []
    parseCSV(filename, tester_device_data, function () {
        TesterDevice.bulkCreate(tester_device_data).then(function () {
            callback();
            //return TesterDevice.findAll();
        }).then(function (testersDevices) {
            callback();
            //console.log(testersDevices)
        });
    });
}

// parse each CSV file and convert to JSON
function parseCSV(path, arr, callback) {
    var stream = fs.createReadStream(path);
    var name = path.split('/')[1].split('.')[0];
    switch (name) {
        case 'testers':
            parse
             .fromStream(stream, { headers: true })
             .on("data", function (data) {
                 arr.push(data)
             })
             .on("end", function () {
                 callback()
             });
            break;
        case 'bugs':
            parse
             .fromStream(stream, { headers: true })
             .on("data", function (data) {
                 arr.push(data)
             })
             .on("end", function () {
                 callback()
             });
            break;
        case 'devices':
            parse
             .fromStream(stream, { headers: true })
             .on("data", function (data) {
                 arr.push(data)
             })
             .on("end", function () {
                 callback();
             });
            break;
        case 'tester_device':
            parse
             .fromStream(stream, { headers: true })
             .on("data", function (data) {
                 arr.push(data)
             })
             .on("end", function () {
                 callback()
             });
    }
}


// --------------------------------- Fetch Data --------------------------------------- //

app.get("/api/getTesters/:countries/:devices", function (req, res) {
    var param1 = req.params.countries;
    var param2 = req.params.devices;
    var countries = param1.split('=')[1].split(',');
    var devices = param2.split('=')[1].split(',');
    var q_country = [];
    var q_device = [];
    for (var i = 0; i < countries.length; i++) {
        q_country.push(String(countries[i]));
    }
    for (var i = 0; i < devices.length; i++) {
        q_device.push(String(devices[i]));
    }

    var q = 'select fin.firstName, d.description, fin.bugs \
            from ( \
	            select t.firstName, temp.deviceId, temp.bugs \
	            from testers t \
	            right join ( \
		            select b.*, count(*) as bugs \
            from bugs b \
            where b.testerId in ( \
                select t.testerId \
			            from testers t \
			            where t.country in (:country) \
		            ) and b.deviceId in ( \
			            select d.deviceId \
			            from devices d \
			            where d.description in (:device)  \
		            ) \
		            group by b.testerId, b.deviceId \
		            order by bugs desc \
	            ) temp on temp.testerId = t.testerId \
            ) fin, devices d \
            where fin.deviceId = d.deviceId';

    sequelize.query(q, { replacements: {country: q_country, device: q_device}, type: sequelize.QueryTypes.SELECT }).then(function (testers) {
        res.json(testers);
    })
});

// -------------------------------- start server --------------------------------------- //

var port = process.env.port || 4000

var server = app.listen(port, function () {
    var host = server.address().address || '127.0.0.1';
    var port = server.address().port  || 4000;

    console.log('Example app listening at http://%s:%s', host, port);
});

//var ip = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
//var port = process.env.port || 4000;

//app.listen(port, ip);

// ------------------------------------------------------------------------------------- //