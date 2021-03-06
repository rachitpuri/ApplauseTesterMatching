﻿"use strict"

app.controller("HomeController", function ($scope, $http, $routeParams, $log) {
    $(function () {
        $('#countries').multiselect({
            includeSelectAllOption: true
        });
        $('#devices').multiselect({
            includeSelectAllOption: true
        });
    });

    $scope.validSearch = false;
    $scope.errormsg = false;

    /*
    * Displays Testers associated with particular device along with the bugs found for that device
    * in a sorted order. 
    */
    $scope.search = function() {
        var country = $("#countries option:selected");
        var list_country = [];
        country.each(function () {
            list_country.push($(this).text())
        });
        var device = $("#devices option:selected");
        var list_device = [];
        device.each(function () {
            list_device.push($(this).text())
        });

        if (list_country.length > 0 && list_device.length > 0) {
            $scope.validSearch = true;
            $scope.errormsg = false;

            // send request to server
            var countries = "country=" + list_country;
            var devices = "device=" + list_device;
            
            $http.get("api/getTesters/" + countries + "/" + devices)
            .success(function (response) {
                console.log(response)
                $scope.testers = response.result;
            }).error(function (error) {
                console.log(error)
            })
        } else {
            $scope.validSearch = false;
            $scope.errormsg = true;
        }
    }

    $scope.selIdx = -1;

    $scope.isSelected = function (user) {
        return $scope.selectedUser === user;
    }

    /*
    * Get the complete list of devices along with bugs found for a selected Tester
    */
    $scope.getTesterDetail = function (user, index) {
        if ($scope.selectedUser === user) {
            $scope.selectedUser = false;
        } else {
            $scope.selectedUser = user;
        }
        $scope.selIdx = index;
        var tester = user.firstName;
        
        var device = $("#devices option:selected");
        var list_device = [];
        device.each(function () {
            list_device.push($(this).text())
        });
        var devices = "device=" + list_device;
        $http.get("api/device/contribution/" + tester +"/" +devices)
            .success(function (response) {
                console.log(response)
                $scope.items = response.result;
            }).error(function (error) {
                console.log(error)
            })
    }
})