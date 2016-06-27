
module.exports = function (sequelize) {

    // Returns list of Testers based on countries and devices
    module.exports.getTesters = function (params, callback) {
        var param1 = params.countries;
        var param2 = params.devices;
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

        sequelize.query(q, { replacements: { country: q_country, device: q_device }, type: sequelize.QueryTypes.SELECT })
            .then(function (testers) {
                //res.status(200).send(testers);
                callback({ status: 200, result: testers });
            })
            .catch(function (err) {
                callback({ status: 400, result: err });
                //res.status(400).send(err);
            });
    }

    // Returns Testers details for the list of devices
    module.exports.getTesterDetail = function (params, callback) {
        var param1 = params.tester;
        var param2 = params.devices;
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

        sequelize.query(q, { replacements: { name: param1, device: q_device }, type: sequelize.QueryTypes.SELECT })
            .then(function (testers) {
                //res.send(testers);
                callback({ status: 200, result: testers })
            })
            .catch(function (err) {
                //res.status(400).send(err);
                callback({ status: 200, result: err })
            })
    }
}
