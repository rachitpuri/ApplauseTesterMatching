var _ = require('lodash');

module.exports = function (Sequelize, fs, parse, app, fn) {
    
    var config = {};

    var MODE_TEST = 'mode_test'
    var MODE_PRODUCTION = 'mode_production'

    var HOST = process.env.OPENSHIFT_MYSQL_DB_HOST || 'localhost';
    var PORT = process.env.OPENSHIFT_MYSQL_DB_PORT || 3306;
    var USER = process.env.OPENSHIFT_MYSQL_DB_USERNAME || 'root';
    var PASSWORD = process.env.OPENSHIFT_MYSQL_DB_PASSWORD || 'siso@123'
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

    // ---------------------------------- Test DB connection ---------------------------------- //

    sequelize
        .authenticate()
        .then(function (err) {
            console.log('Connection has been established successfully.');
            _.set(config, 'connect', sequelize);
            fn(config);
        })
        .catch(function (err) {
            console.log('Unable to connect to the database:', err);
        });

    // -------------------------------- Database Schema --------------------------------------- //

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
}

// --------------------------------------------------------------------------------------------- //