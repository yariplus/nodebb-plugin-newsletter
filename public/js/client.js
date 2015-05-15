"use strict";

define('admin/plugins/newsletter', ['composer/formatting', 'composer/preview', 'composer/uploads'], function (formatting, preview, uploads) {
	var Newsletter = { };

	Newsletter.init = function () {
		var $newsletter = $('#newsletter');

		$('#newsletter-send').click(function (e) {
			e.preventDefault();
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
			if (Newsletter.timeoutId) {
				clearTimeout(Newsletter.timeoutId);
				Newsletter.timeoutId = 0;
			}
			var textarea = $('#newsletter-template');

			Newsletter.timeoutId = setTimeout(function() {
				socket.emit('modules.composer.renderPreview', textarea.val(), function(err, $preview) {
					timeoutId = 0;
					if (err) {
						return;
					}
					$preview = $($preview);
					$preview.find('img').addClass('img-responsive');
					$('#newsletter-preview').html($preview);
					preview.matchScroll($newsletter);
				});
			}, 250);
		}

		$('#newsletter-template').on('input', function (e) {
			render();
		});

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
