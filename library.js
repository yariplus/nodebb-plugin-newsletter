"use strict";

(function(nbb){

	var Newsletter = { },
		async      = require('async'),
		winston    = require('winston'),
		NodeBB     = { },
		db         = nbb.require('./database'),
		Emailer    = nbb.require('./emailer'),
		User       = nbb.require('./user'),
		Groups     = nbb.require('./groups'),
		SioPlugins = nbb.require('./socket.io/plugins');

	Newsletter.load = function (data, callback) {
		// Delegate arguments
		if (arguments.length === 2) {
			// NodeBB version >=0.6.0
			NodeBB.app = data.app;
			NodeBB.router = data.router;
			NodeBB.middleware = data.middleware;
		}else if(arguments.length === 4 && typeof arguments[3] === 'function') {
			// NodeBB version <=0.5.0
			NodeBB.app = data;
			NodeBB.router = data;
			NodeBB.middleware = callback;
			callback = arguments[3];
		}else{
			return winston.info("[Newsletter] Failed to load plugin. Invalid arguments found for app.load(). Are you sure you're using a compatible version of NodeBB?");
		}

		function render (req, res, next) {
			//db.getSortedSetRange('groups:createtime', 0, -1, function (err, groups) {
				Groups.list({ }, function (err, data) {
					var groups = [ ];
					for (var i in data) groups.push({name: data[i].name});
					res.render('admin/plugins/newsletter', {groups: groups});
				});
			//});
		}

		NodeBB.router.get('/admin/plugins/newsletter', NodeBB.middleware.admin.buildHeader, render);
		NodeBB.router.get('/api/admin/plugins/newsletter', render);
		NodeBB.router.get('/newsletter/config', function (req, res) {
			res.status(200);
		});

		SioPlugins.Newsletter = { };
		SioPlugins.Newsletter.send = function (socket, data, callback) {
			if (!socket.uid) {
				return callback(false);
			}
			User.isAdministrator(socket.uid, function(err, isAdmin) {
				if (!err && isAdmin) {
					winston.info('[Newsletter] uid ' + socket.uid + ' sent a newsletter.');
					if (data.group === 'everyone') {
						data.group = 'users:joindate';
					}else{
						data.group = 'group:' + data.group + ':members';
					}
					async.waterfall([
						function (next) {
							db.getSortedSetRange(data.group, 0, -1, next);
						},
						function (uids, next) {
							User.getMultipleUserFields(uids, ['uid', 'username', 'banned'], next);
						},
						function (users, next) {
							winston.info('[Newsletter] Sending email newsletter to '+users.length+' users: ');
							async.eachLimit(users, 100, function (userObj, next) {
								if (parseInt(userObj.banned, 10) === 1) return next();
								Emailer.send('newsletter', userObj.uid, {
									subject: data.subject,
									username: userObj.username,
									body: data.template.replace('{username}', userObj.username)
								});
								return next();
							}, next);
						}
					], function (err, results) {
						if (err) {
							callback(false);
							winston.warn('Error sending emails: ' + err);
						}else{
							callback(true);
							winston.info('Done sending emails.');
						}
					});
				} else {
					winston.warn('[socket.io] Call to admin method ( ' + 'plugins.Newsletter.send' + ' ) blocked (accessed by uid ' + socket.uid + ')');
					callback(false);
				}
			});
		};

		callback();
	};

	Newsletter.adminHeader = function (custom_header, callback) {
		custom_header.plugins.push({
			"route": '/plugins/newsletter',
			"icon": 'fa-newspaper-o ',
			"name": 'Newsletter'
		});

		callback(null, custom_header);
	};

	module.exports = Newsletter;

})(module.parent);
