define('admin/plugins/newsletter',[
	'composer/formatting',
	'composer/preview',
	'composer/uploads',
	'composer/controls',
	'translator'
], (formatting, preview, uploads, controls, translator) => {
    const Newsletter = { };

    Newsletter.init = () => {
		const $newsletter = $('#newsletter');

		$('#newsletter-send').click(e => {
			e.preventDefault();

			$('#newsletter-preview').find(".emoji").attr("style", "width:20px;height:20px;");

			// Append origin to uploaded images/files.
			$newsletter.find('#newsletter-preview').find('img').each(function(){
				const $el = $(this);
				const src = $el.attr('src');
				const origin = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;
				if (src.match(/^\/uploads/)) $el.attr('src', origin + src);
			});

			$newsletter.find('#newsletter-preview').find('a').each(function(){
				const $el = $(this);
				const src = $el.attr('href');
				const origin = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;
				if (src.match(/^\/uploads/)) $el.attr('href', origin + src);
			});

			socket.emit('plugins.Newsletter.send', {
				subject: $('#newsletter-subject').val(),
				template: $('#newsletter-preview').html(),
				group: $('#newsletter-group').val()
			}, success => {
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
			const raw = $('#raw').is(":checked");

			if (preview) {
				if (raw) {
					$('#newsletter-preview').html($('#newsletter-template').val());
					$('.btn-group.col-sm-12').hide();
				}else{
					preview.render($newsletter);
					$('.btn-group.col-sm-12').show();
				}
			}
		}

		$('#newsletter-template').on('input propertychange', render);
		$('#newsletter-template').select(render);
		$('#raw').change(render);

		$('#newsletter-template').on('scroll', e => {
			if (preview) {
				preview.matchScroll($newsletter);
			}
		});

		render();

		formatting.addHandler($newsletter);
		formatting.addComposerButtons();

		if (config.hasImageUploadPlugin) {
			$newsletter.find('.img-upload-btn').removeClass('hide');
			$newsletter.find('#files.lt-ie9').removeClass('hide');
		}

		if (config.allowFileUploads) {
			$newsletter.find('.file-upload-btn').removeClass('hide');
			$newsletter.find('#files.lt-ie9').removeClass('hide');
		}

		if (uploads) {
			uploads.initialize("newsletter");
		}

		// TEMP: Mimic a real composer for Markdown.
		if (formatting && controls) {
			translator.getTranslations(window.config.userLang || window.config.defaultLang, 'markdown', strings => {
				formatting.addButtonDispatch('bold', (textarea, selectionStart, selectionEnd) => {
					if(selectionStart === selectionEnd){
						controls.insertIntoTextarea(textarea, `**${strings.bold}**`);
						controls.updateTextareaSelection(textarea, selectionStart + 2, selectionStart + strings.bold.length + 2);
					} else {
						controls.wrapSelectionInTextareaWith(textarea, '**');
						controls.updateTextareaSelection(textarea, selectionStart + 2, selectionEnd + 2);
					}
				});

				formatting.addButtonDispatch('italic', (textarea, selectionStart, selectionEnd) => {
					if(selectionStart === selectionEnd){
						controls.insertIntoTextarea(textarea, `*${strings.italic}*`);
						controls.updateTextareaSelection(textarea, selectionStart + 1, selectionStart + strings.italic.length + 1);
					} else {
						controls.wrapSelectionInTextareaWith(textarea, '*');
						controls.updateTextareaSelection(textarea, selectionStart + 1, selectionEnd + 1);
					}
				});

				formatting.addButtonDispatch('list', (textarea, selectionStart, selectionEnd) => {
					if(selectionStart === selectionEnd){
						controls.insertIntoTextarea(textarea, `\n* ${strings.list_item}`);

						// Highlight "list item"
						controls.updateTextareaSelection(textarea, selectionStart + 3, selectionStart + strings.list_item.length + 3);
					} else {
						controls.wrapSelectionInTextareaWith(textarea, '\n* ', '');
						controls.updateTextareaSelection(textarea, selectionStart + 3, selectionEnd + 3);
					}
				});

				formatting.addButtonDispatch('strikethrough', (textarea, selectionStart, selectionEnd) => {
					console.log(strings);
					if(selectionStart === selectionEnd){
						controls.insertIntoTextarea(textarea, `~~${strings.strikethrough_text}~~`);
						controls.updateTextareaSelection(textarea, selectionStart + 2, selectionEnd + strings.strikethrough_text.length + 2);
					} else {
						controls.wrapSelectionInTextareaWith(textarea, '~~', '~~');
						controls.updateTextareaSelection(textarea, selectionStart + 2, selectionEnd + 2);
					}
				});

				formatting.addButtonDispatch('link', (textarea, selectionStart, selectionEnd) => {
					if(selectionStart === selectionEnd){
						controls.insertIntoTextarea(textarea, `[${strings.link_text}](${strings.link_url})`);

						// Highlight "link url"
						controls.updateTextareaSelection(textarea, selectionStart + strings.link_text.length + 3, selectionEnd + strings.link_text.length + strings.link_url.length + 3);
					} else {
						controls.wrapSelectionInTextareaWith(textarea, '[', `](${strings.link_url})`);

						// Highlight "link url"
						controls.updateTextareaSelection(textarea, selectionEnd + 3, selectionEnd + strings.link_url.length + 3);
					}
				});

				formatting.addButtonDispatch('picture-o', (textarea, selectionStart, selectionEnd) => {
					if(selectionStart === selectionEnd){
						controls.insertIntoTextarea(textarea, `![${strings.picture_text}](${strings.picture_url})`);

						// Highlight "picture url"
						controls.updateTextareaSelection(textarea, selectionStart + strings.picture_text.length + 4, selectionEnd + strings.picture_text.length + strings.picture_url.length + 4);
					} else {
						controls.wrapSelectionInTextareaWith(textarea, '![', `](${strings.picture_url})`);

						// Highlight "picture url"
						controls.updateTextareaSelection(textarea, selectionEnd + 4, selectionEnd + strings.picture_url.length + 4);
					}
				});
			})
		}

		$('span[data-format]').tooltip();
	};

    return Newsletter;
});
