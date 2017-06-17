/* global define, $, app, config, socket */

define('admin/plugins/newsletter', [
  'translator',
  'uploader',
  'ace/ext-language_tools',
  '/plugins/nodebb-plugin-newsletter/public/tinymce/tinymce.min.js',
  ], (translator, uploader) => {
  const Newsletter = {}

  Newsletter.init = () => {
    let $newsletter = $('#newsletter')
    let $everyone = $('#checkbox-everyone')
    let $custom = $('#custom-groups')

    function displayCustomGroups() {
      if ($everyone[0].checked) {
        $custom.hide()
      } else {
        $custom.show()
      }
    }

    tinymce.init({
      selector: '#newsletter-template',
      plugins: 'code',
      toolbar: 'code',
    })

    $('#newsletter-preview').click(() => {
      $('#newsletter-modal-subject').html($('#newsletter-subject').val())
      $('#newsletter-modal-body').html(editor.getValue())
    })

    $('#newsletter-send').click(() => {
      // Append origin to uploaded images/files.
      var body = editor.getValue();
      var port = window.location.port ? ':' + window.location.port : '';
      var origin = window.location.protocol + '//' + window.location.hostname + port;

      body = body.replace(new RegExp('(href="' + config.relative_path + ')(/)', 'gi'), '$1' + origin + '$2');
      body = body.replace(new RegExp('(src="' + config.relative_path + ')(/)', 'gi'), '$1' + origin + '$2');

      socket.emit('admin.Newsletter.send', {
        subject: $('#newsletter-subject').val(),
        template: body,
        group: $('#newsletter-group').val()
      }, function (err) {
        if (err) {
          app.alertError(err);
        } else {
          app.alertSuccess('Newsletter Sent');
        }
      })
    })

    $everyone.on('change', displayCustomGroups)

    displayCustomGroups()
  }

  return Newsletter
})
