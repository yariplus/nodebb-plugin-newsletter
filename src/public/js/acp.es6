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

    function displayCustomGroups (next) {
      if ($everyone[0].checked) {
        $custom.fadeOut(next)
      } else {
        $custom.fadeIn(next)
      }
    }

    $('#newsletter-send').click(() => {
      let body = tinymce.activeEditor.getContent()
      let subject = $('#newsletter-subject').val()
      let groups = getSelectedGroups()

      socket.emit('admin.Newsletter.send', {subject, body, groups}, err => {
        if (err) {
          app.alertError(err);
        } else {
          app.alertSuccess('Newsletter Sent Successfully!');
        }
      })
    })

    $everyone.on('change', displayCustomGroups)

    tinymce.init({
      selector: '#newsletter-template',
      plugins: [
        'advlist autolink lists link image charmap hr anchor pagebreak',
        'searchreplace wordcount visualblocks visualchars code',
        'insertdatetime media nonbreaking contextmenu',
        'textpattern imagetools',
        'autoresize textcolor colorpicker table directionality',
      ],
      toolbar: 'undo redo | insert | styleselect | bold italic | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | ltr rtl | code',
      menubar: '',
      autoresize_bottom_margin: 0,
      autoresize_min_height: 360,
      resize: false,
      setup: editor => {
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
