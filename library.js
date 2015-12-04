"use strict";

var	NodeBB     = module.parent,
	db         = NodeBB.require('./database'),
	Emailer    = NodeBB.require('./emailer'),
	User       = NodeBB.require('./user'),
	Groups     = NodeBB.require('./groups'),
	Meta       = NodeBB.require('./meta'),
	Plugins    = NodeBB.require('./plugins'),
	SioPlugins = NodeBB.require('./socket.io/plugins'),

	async      = require('async'),
	winston    = require('winston'),
	nconf      = require('nconf'),

	Newsletter = module.exports = { };

function prepend(msg) { return "[Newsletter] " + msg; }

// Hook: static:app.load
Newsletter.load = function (data, callback) {

	winston.info(prepend("Initializing Newsletter..."));

	var	router     = data.router,
		middleware = data.middleware;

	function render (req, res, next) {
		async.parallel({
			groups: function(next) {
				db.getSortedSetRevRange("groups:createtime", 0, -1, function (err, groups) {
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

	router.get('/admin/plugins/newsletter', middleware.admin.buildHeader, render);
	router.get('/api/admin/plugins/newsletter', render);

	SioPlugins.Newsletter = { };

	// The user clicked send on the Newsletter page.
	SioPlugins.Newsletter.send = function (socket, data, callback) {

		// Do all the things.
		async.waterfall([

			// Make sure the user is an admin.
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

			// Get the user fields and settings.
			function (uids, next) {
				async.parallel({
					fields: async.apply(User.getUsersFields, uids, ['uid', 'email', 'username', 'userslug', 'banned']),
					settings: async.apply(User.getMultipleUserSettings, uids)
				}, function (err, results) {
					if (err) return next(err);
					for (var i in results.fields) {
						results.fields[i].pluginNewsletterSub = results.settings[i].pluginNewsletterSub;
					}
					next(null, results.fields);
				});
			},

			// Filter the users.
			function (users, next) {
				async.filter(users, function (user, next) {

					// Check for nulls and warn.
					if (!(!!user && user.uid !== void 0 && !!user.email && !!user.username)) {
						winston.warn('[Newsletter] Null data at uid ' + user.uid + ', skipping.');
						return next(false);
					}

					// Skip banned users and warn.
					if (parseInt(user.banned, 10) === 1) {
						winston.warn('[Newsletter] Banned user at uid ' + user.uid + ', skipping.');
						return next(false);
					}

					// Skip unsubscribed users.
					if (!user.pluginNewsletterSub) {
						winston.warn('[Newsletter] Unsubscribed user at uid ' + user.uid + ', skipping.');
						return next(false);
					}

					// User is valid.
					return next(true);
				}, function (users) {
					next(null, users);
				});
			},
			function (users, next) {

				// Get the site Title.
				Meta.configs.get('title', function(err, title){
					if (err) return next(err);

					// Send the emails.
					winston.info('[Newsletter] Sending email newsletter to ' + users.length + ' users: ');
					async.eachLimit(users, 100, function (userObj, next) {

						// Email options.
						var options = {
							subject: data.subject,
							username: userObj.username,
							body: data.template.replace('{username}', userObj.username),
							title: title,
							userslug: userObj.userslug,
							url: nconf.get('url')
						};

						Emailer.send('newsletter', userObj.uid, options, next);

						// We're done.
					}, function (err) {
						winston.info('[Newsletter] Finished email loop with error value: ' + err);
						next(err);
					});
				});
			}
		], function (err) {
			winston.info('[Newsletter] Done sending emails.');

			// Returns true if there were no errors.
			if (err) {
				winston.warn('[Newsletter] Error sending emails: ' + (err.message || err) );
				callback(false);
			}else{
				callback(true);
			}

			winston.info('[Newsletter] Finished main loop with error value: ' + err);
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

Newsletter.filterUserSettings = function (data, next) {
	//{settings: results.settings, customSettings: [], uid: req.uid}
	data.settings.pluginNewsletterSub = data.settings.pluginNewsletterSub !== void 0 ? parseInt(data.settings.pluginNewsletterSub, 10) === 1 : true;

	data.customSettings.push({
		title: "[[newsletter:sub-setting]]",
		content: '\
		<div class="checkbox">\
			<label>\
				<input type="checkbox" data-property="pluginNewsletterSub"' + (data.settings.pluginNewsletterSub ? ' checked' : '') + '> <strong>[[newsletter:sub]]</strong>\
			</label>\
			<a name="newsletter"></a>\
		</div>'
	});

	next(null, data);
};

Newsletter.filterUserGetSettings = function (data, next) {
	if (data.settings.pluginNewsletterSub === void 0) data.settings.pluginNewsletterSub = '1';

	next(null, data);
};

Newsletter.actionSaveSettings = function (data, next) {
	db.setObjectField('user:' + data.uid + ':settings', 'pluginNewsletterSub', data.settings.pluginNewsletterSub);
};
