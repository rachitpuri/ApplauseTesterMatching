'use strict'

var testerDao = require('./tester_dao.js');

module.exports = function (sequelize) {

    testerDao(sequelize);

    /**
    * Get testers based on countries and devices specified in the request
    */
    module.exports.getTesters = function (params, callback) {
        console.log("Fetching details of Testers for country " + params.countries + "and devices " + params.devices);
        testerDao.getTesters(params, callback);
    }

    /**
    * Get detail list of bugs found in each device by a tester based on tester name
    * and devices specified in the request
    */
    module.exports.getTesterDetail = function (params, callback) {
        console.log("Fetching details of Tester " + params.tester + "for devices " + params.devices);
        testerDao.getTesterDetail(params, callback);
    }
}