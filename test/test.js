var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var expect = require('chai').expect;
var server = require('../');
var request = require("request");

chai.use(chaiHttp);
chai.should();


describe('Testing Tester Matching Web App', function () {
    var myApp = require('../server');
    var port = 8000;
    var baseUrl = 'http://localhost:' + port;

    before(function (done) {
        myApp.start('localhost', port, done);
    });

    after(function (done) {
        myApp.stop(done);
    });

    describe("Testing Hello", function () {
        it("A server should respond with status 200 on /api/hello GET", function (done) {
            request(baseUrl + "/api/hello", function (err, res, body) {
                expect(err).to.not.be.ok;
                expect(body).to.equal('Hello');
                done();
            });
        });
    });

    describe("Testers Based On Countries and Devices", function () {
        it("A server should respond with status 200 on /api/getTesters/:countries/:devices GET", function (done) {
            var countries = ['US'];
            var devices = ['iPhone 4'];
            request(baseUrl + "/api/getTesters/country=" + countries + "/device=" + devices, function (err, res, body) {
                expect(err).to.not.be.ok;
                var response = JSON.parse(body);
                response.should.have.status(200);
                done();
            });
        });

        it("A server should have property {result,firstName,bugs,count} on /api/getTesters/:countries/:devices GET", function (done) {
            var countries = ['US'];
            var devices = ['iPhone 4'];
            request(baseUrl + "/api/getTesters/country=" + countries + "/device=" + devices, function (err, res, body) {
                expect(err).to.not.be.ok;
                var response = JSON.parse(body);
                response.should.have.property("result");
                expect(response.result).to.be.an.instanceof(Array);
                response.result.should.have.length(2);
                response.result[0].should.have.property("firstName");
                response.result[0].should.have.property("bugs");
                response.result[0].should.have.property("count");
                done();
            });
        });

        it("A server should have respond with correct results on /api/getTesters/:countries/:devices GET", function (done) {
            var countries = ['US', 'JP'];
            var devices = ['iPhone 4', 'iPhone 5'];
            request(baseUrl + "/api/getTesters/country=" + countries + "/device=" + devices, function (err, res, body) {
                expect(err).to.not.be.ok;
                var response = JSON.parse(body);
                response.should.have.property("result");
                expect(response.result).to.be.an.instanceof(Array);
                response.result.should.have.length(4);
                expect(response.result[0].firstName).to.equal("Taybin");
                expect(response.result[0].count).to.equal(1);
                expect(response.result[0].bugs).to.equal(66);
                expect(response.result[3].firstName).to.equal("Mingquan");
                expect(response.result[3].count).to.equal(1);
                expect(response.result[3].bugs).to.equal(21);
                done();
            });
        });

        it("A server should respond with status 200 on /api/device/contribution/:tester/:devices GET", function (done) {
            var countries = ['US'];
            var devices = ['iPhone 4'];
            request(baseUrl + "/api/getTesters/country=" + countries + "/device=" + devices, function (err, res, body) {
                expect(err).to.not.be.ok;
                var response = JSON.parse(body);
                response.should.have.status(200);
                done();
            });
        });

        it("A server should respond with correct results on /api/device/contribution/:tester/:devices GET", function (done) {
            var tester = 'Sean';
            var devices = ['iPhone 4', 'iPhone 5'];
            request(baseUrl + "/api/device/contribution/" + tester + "/device=" + devices, function (err, res, body) {
                expect(err).to.not.be.ok;
                var response = JSON.parse(body);
                response.should.have.property("result");
                expect(response.result).to.be.an.instanceof(Array);
                response.result.should.have.length(2);
                expect(response.result[0].description).to.equal("iPhone 5");
                expect(response.result[0].bugs).to.equal(30);
                expect(response.result[1].description).to.equal("iPhone 4");
                expect(response.result[1].bugs).to.equal(28);
                done();
            });
        });
    })
})



