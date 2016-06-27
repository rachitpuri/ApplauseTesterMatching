'use strict'

/**
 * Load the middleware modules used by the app
 * @param {object} sequelize : database connection object
 * @param {object} app : Main Express application
 */

module.exports = function (sequelize, app) {
    require('./modules/testers/routes.js')(sequelize, app);
};