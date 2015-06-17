"use strict";

(function(nbb){

	var Newsletter = { },
		async      = require('async'),
		winston    = require('winston'),
		nconf      = require('nconf'),
		NodeBB     = { },
		db         = nbb.require('./database'),
		Emailer    = nbb.require('./emailer'),
		User       = nbb.require('./user'),
		Groups     = nbb.require('./groups'),
		Meta       = nbb.require('./meta'),
		Plugins    = nbb.require('./plugins'),
		SioPlugins = nbb.require('./socket.io/plugins');

	Newsletter.load = function (params, callback) {
		// Delegate arguments
		if (arguments.length === 2) {
			NodeBB.app = params.app;
			NodeBB.router = params.router;
			NodeBB.middleware = params.middleware;
		}else{
			return winston.info("[Newsletter] Failed to load plugin. Invalid arguments found for app.load(). Are you sure you're using a compatible version of NodeBB?");
		}

		function render (req, res, next) {
			async.parallel({
				groups: function(next) {
					Groups.getGroups(0, -1, function (err, groups) {
						if (err) {
							winston.warn("[Newsletter] Failed to load groups: " + err);
							return next(err);
						}
						function groupsFilter(group, next) {
							next(group.slice(0,3) !== 'cid' && group !== 'administrators' && group !== 'registered-users');
						}
						function groupsMap(group, next) {
							next(null, {name: group});
						}
						async.waterfall([
							function (next) {
								async.filter(groups, groupsFilter, function (_groups) {
									next(null, _groups);
								});
							},
							function (_groups, next) {
								async.map(_groups, groupsMap, next);
							}
						], next);
					});
				},
				formatting: function (next) {
					Plugins.fireHook('filter:composer.formatting', {
						options: [
							{ name: 'tags', className: 'fa fa-tags', mobile: true }
						]
					}, function (err, payload) {
						next(err, payload.options);
					});
				}
			},
			function (err, payload) {
				if (!err) {
					res.render('admin/plugins/newsletter', payload);
				}else{
					res.send("Error: " + err);
				}
			});
		}

		NodeBB.router.get('/admin/plugins/newsletter', NodeBB.middleware.admin.buildHeader, render);
		NodeBB.router.get('/api/admin/plugins/newsletter', render);
		NodeBB.router.get('/newsletter/config', function (req, res) {
			res.status(200);
		});

		SioPlugins.Newsletter = { };

		// The user clicked send on the Newsletter page.
		SioPlugins.Newsletter.send = function (socket, data, callback) {

			// Do all the things.
			async.waterfall([

				// Make the user is an admin.
				async.apply(User.isAdministrator, socket.uid),
				function (isAdmin, next) {

					// Do a warning if the user is not an admin.
					if (isAdmin) {
						winston.info('[Newsletter] uid ' + socket.uid + ' sent a newsletter.');
					}else{
						winston.warn('[socket.io] Call to admin method ( ' + 'plugins.Newsletter.send' + ' ) blocked (accessed by uid ' + socket.uid + ')');
						return next(new Error("[[error:not_admin]]"));
					}

					// Set the correct group.
					if (data.group === 'everyone') {
						data.group = 'users:joindate';
					}else{
						data.group = 'group:' + data.group + ':members';
					}
					winston.info('[Newsletter] Sending to group "' + data.group + '".');
					return next();
				},

				// Get the users
				function (next) {
					db.getSortedSetRange(data.group, 0, -1, next);
				},
				// Why doesn't this work?
				// async.apply(db.getSortedSetRange, data.group, 0, -1),
				function (uids, next) {
					console.log(uids);
					next(null, uids, ['uid', 'email', 'username', 'banned']);
				},
				async.apply(User.getMultipleUserFields),

				//
				function (users, next) {

					// Get the site Title.
					Meta.configs.get('title', function(err, title){
						if (err) return next(err);

						// Send the emails.
						winston.info('[Newsletter] Sending email newsletter to '+users.length+' users: ');
						async.eachLimit(users, 100, function (userObj, next) {

							// Check for nulls and warn.
							if (!(!!userObj && !!userObj.uid && !!userObj.email && !!userObj.username)) {
								winston.warn('[Newsletter] Null data at uid ' + userObj.uid + ', skipping.');
								return next();
							}

							// Skip banned users silently.
							if (parseInt(userObj.banned, 10) === 1) return next();

							// Email options.
							var options = {
								subject: data.subject,
								username: userObj.username,
								body: data.template.replace('{username}', userObj.username),
								title: title,
								url: nconf.get('url')
							};

							// Send and go to next user. It will automagically wait if over 100 threads I think.
							Emailer.send('newsletter', userObj.uid, options);
							return next();

							// We're done.
						}, next);
					});
				}
			], function (err) {

				// Returns true if there were no errors.
				if (err) {
					winston.warn('Error sending emails: ' + (err.message || err) );
					return callback(false);
				}else{
					winston.info('[Newsletter] Done sending emails.');
					return callback(true);
				}
			});
		};

		// End of app.load
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
