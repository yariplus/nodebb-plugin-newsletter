"use strict";

define('admin/plugins/newsletter', ['composer/formatting', 'composer/preview', 'composer/uploads'], function (formatting, preview, uploads) {
	var Newsletter = { };

	Newsletter.init = function () {
		var $newsletter = $('#newsletter');

		$('#newsletter-send').click(function (e) {
			e.preventDefault();

			$('#newsletter-preview').find(".emoji").attr("style", "width:20px;height:20px;");

			socket.emit('plugins.Newsletter.send', {
				subject: $('#newsletter-subject').val(),
				template: $('#newsletter-preview').html(),
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

		function render() {
			preview.render($newsletter, function (err, data) { });
		}

		$('#newsletter-template').on('input propertychange', render);
		$('#newsletter-template').select(render);

		$('#newsletter-template').on('scroll', function (e) {
			preview.matchScroll($newsletter);
		});

		render();

		formatting.addHandler($newsletter);
		formatting.addComposerButtons($newsletter);

		if (config.hasImageUploadPlugin) {
			$newsletter.find('.img-upload-btn').removeClass('hide');
			$newsletter.find('#files.lt-ie9').removeClass('hide');
		}

		if (config.allowFileUploads) {
			$newsletter.find('.file-upload-btn').removeClass('hide');
			$newsletter.find('#files.lt-ie9').removeClass('hide');
		}

		uploads.initialize("newsletter");
	};

	return Newsletter;
});
