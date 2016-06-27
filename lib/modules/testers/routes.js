'use strict'

var testerController = require('./controller');

module.exports = function (sequelize, app) {

    testerController(sequelize);

    /*
    * GET sorted list of Testers based on number of bugs found in desc order
    * Sends Testers list with status code 200, in case of success
    * Sends an errored response with status code 400, otherwise
    * @param:  req, res
    */
    app.get('/api/getTesters/:countries/:devices', function (req, res) {
        testerController.getTesters(req.params, function (results) {
            res.json(results);
        });
    });

    /*
    * Get detail list of bugs found in each device by a tester based on tester name
    * and devices specified in the request.
    * Sends Device list with status code 200, in case of success
    * Sends an errored response with status code 400, otherwise
    * @param:  req, res
    */
    app.get('/api/device/contribution/:tester/:devices', function (req, res) {
        testerController.getTesterDetail(req.params, function (results) {
            res.json(results);
        });
    });
}