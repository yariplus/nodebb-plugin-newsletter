"use strict";

define('admin/plugins/newsletter', function () {
	var Newsletter = { };

	Newsletter.init = function () {
		$('#newsletter-send').click(function (e) {
			e.preventDefault();
			socket.emit('plugins.Newsletter.send', {
				subject: $('#newsletter-subject').val(),
				template: $('#newsletter-template').val(),
				group: $('#newsletter-group').val()
			}, function (success) {
				if (success) {
					app.alert({
						type: 'success',
						alert_id: 'newsletter-send',
						title: 'Newsletter Sent'
					});
				}else{
					app.alert({
						type: 'error',
						alert_id: 'newsletter-send',
						title: 'Error'
					});
				}
			});
		});
	};

	return Newsletter;
});
