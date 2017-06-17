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

    function displayCustomGroups(next) {
      if ($everyone[0].checked) {
        $custom.fadeOut(next)
      } else {
        $custom.fadeIn(next)
      }
    }

    $('#newsletter-preview').click(() => {
      $('#newsletter-modal-subject').html($('#newsletter-subject').val())
      $('#newsletter-modal-body').html(tinymce.activeEditor.getContent())
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

    tinymce.init({
      selector: '#newsletter-template',
      plugins: [
        'advlist autolink lists link image charmap preview hr anchor pagebreak',
        'searchreplace wordcount visualblocks visualchars code',
        'insertdatetime media nonbreaking contextmenu',
        'textpattern imagetools',
        'autoresize textcolor colorpicker smileys table directionality',
      ],
      toolbar: 'undo redo | insert smileys | styleselect | bold italic | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | ltr rtl | code preview | help',
      menubar: '',
      autoresize_bottom_margin: 0,
      autoresize_min_height: 360,
      resize: false,
      setup: (editor) => {
        editor.on('init', () => {
          displayCustomGroups(() => {
            $newsletter.fadeIn()
          })
        })
      },
    })
  }

  return Newsletter
})
