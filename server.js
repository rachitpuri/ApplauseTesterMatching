"use strict"

var express = require('express');
var bodyParser = require('body-parser');
var Sequelize = require('sequelize');
var fs = require('fs');
var parse = require('fast-csv');

var app = express();
app.use(express.static(__dirname + '/'));

var MODE_TEST = 'mode_test'
var MODE_PRODUCTION = 'mode_production'

var HOST = process.env.OPENSHIFT_MYSQL_DB_HOST || 'localhost';
var PORT = process.env.OPENSHIFT_MYSQL_DB_PORT || 3306;
var USER = process.env.OPENSHIFT_MYSQL_DB_USERNAME || 'root';
var PASSWORD = process.env.OPENSHIFT_MYSQL_DB_PASSWORD || 'siso@123';
var PRODUCTION_DB = 'applause';
var TEST_DB = 'applause2'

var state = {
    pool: null,
    mode: null,
}

var sequelize = new Sequelize(PRODUCTION_DB, USER, PASSWORD, {
    host: HOST,
    port: PORT,
    dialect: 'mysql',
    pool: false
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

// -------------------------------- Create Tables --------------------------------- //

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

// --------------------------------Read CSV files and fill database ---------------------------------- //

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

// fill Testers Table
function fillTesterData(filename, callback) {
    var tester_data = []
    parseCSV(filename, tester_data, function () {
        Tester.bulkCreate(tester_data).then(function () {
            callback();
        }).then(function (testers) {
            callback();
        });
    });
}

// fill Devices Table
function fillDeviceData(filename, callback) {
    var device_data = []
    parseCSV(filename, device_data, function () {
        Device.bulkCreate(device_data).then(function () {
            callback();
        }).then(function (devices) {
            callback();
        });
    });
}

// fill Bug Table
function fillBugData(filename, callback) {
    var bug_data = []
    parseCSV(filename, bug_data, function () {
        Bug.bulkCreate(bug_data).then(function () {
            callback();
        }).then(function (bugs) {
            callback();
        });
    });
}

// fill TestersDevice Table
function fillTesterDeviceData(filename, callback) {
    var tester_device_data = []
    parseCSV(filename, tester_device_data, function () {
        TesterDevice.bulkCreate(tester_device_data).then(function () {
            callback();
        }).then(function (testersDevices) {
            callback();
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

/*
* GET sorted list of Testers based on number of bugs found
*/
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

    var q = 'select t.firstName, temp.count, temp.bugs \
	         from testers t \
	         right join ( \
                select tp.bugId, count(*) as count, tp.testerId, SUM(tp.bugs) as bugs \
                from ( \
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
	                    ) tp \
                        group by tp.testerId \
                        order by bugs desc \
                    ) temp on temp.testerId = t.testerId'

    sequelize.query(q, { replacements: {country: q_country, device: q_device}, type: sequelize.QueryTypes.SELECT }).then(function (testers) {
        res.json(testers);
    })
});

/*
* GET list of devices tester worked on along with bugs found in each device
*/
app.get("/api/device/contribution/:tester/:devices", function (req, res) {
    var param1 = req.params.tester;
    var param2 = req.params.devices;
    var devices = param2.split('=')[1].split(',');
    var q_device = [];
    for (var i = 0; i < devices.length; i++) {
        q_device.push(String(devices[i]));
    }

    var q = 'select d.description, fin.bugs \
            from ( \
                select b.*, count(*) as bugs \
                from bugs b \
                where b.testerId in ( \
                    select t.testerId \
                    from testers t \
                    where t.firstName = :name \
                    ) and b.deviceId in ( \
                        select d.deviceId \
                        from devices d \
                        where d.description in (:device) \
                    ) \
                    group by b.deviceId \
                    order by bugs desc \
                ) fin, devices d \
            where fin.deviceId = d.deviceId'

    sequelize.query(q, { replacements: { name: param1, device: q_device }, type: sequelize.QueryTypes.SELECT }).then(function (testers) {
        res.json(testers);
    })
});

// -------------------------------- start server --------------------------------------- //

var ip = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var port = process.env.OPENSHIFT_NODEJS_PORT || 4000;

app.listen(port, ip);

// ------------------------------------------------------------------------------------- //