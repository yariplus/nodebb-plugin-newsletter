/* global define, $, app, config, socket */

define('admin/plugins/newsletter', [
  'translator',
  'uploader', // WIP
  '/plugins/nodebb-plugin-newsletter/public/tinymce/tinymce.min.js',
  ], (translator, uploader) => {
  const Newsletter = {}

  Newsletter.init = () => {
    let $newsletter = $('#newsletter')
    let $everyone = $('#checkbox-everyone')
    let $custom = $('#custom-groups')

    // Fade custom groups on page load or 'everyone' toggle.
    function displayCustomGroups (next) {
      if ($everyone[0].checked) {
        $custom.fadeOut(next)
      } else {
        $custom.fadeIn(next)
      }
    }

    // Get the names of all selected groups.
    function getSelectedGroups () {
      let groups = []

      $('.nl-group').each((i, el) => {
        if (el.checked) {
          groups.push(el.id.split('checkbox-')[1])
        }
      })

      return groups
    }

    // Fade in page.
    function setupPage () {
      tinymce.initialized = true
      displayCustomGroups(() => {
        $newsletter.fadeIn()
      })
    }

    $('#newsletter-send').click(() => {
      let body = tinymce.activeEditor.getContent()
      let subject = $('#newsletter-subject').val()
      let groups = getSelectedGroups()
      let override = $('#checkbox-override')[0].checked

      socket.emit('admin.Newsletter.send', {subject, body, groups, override}, err => {
        if (err) {
          app.alertError(err)
        } else {
          app.alertSuccess('Newsletter Sent Successfully!')
        }
      })
    })

    $everyone.on('change', displayCustomGroups)

    if (tinymce.initialized) {
      tinymce.EditorManager.execCommand('mceRemoveEditor', true, 'newsletter-body')
      tinymce.EditorManager.execCommand('mceAddEditor', true, 'newsletter-body')
      setupPage()
    } else {
      tinymce.init({
        selector: '#newsletter-body',
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
          editor.on('init', setupPage)
        },
      })
    }
  }

  return Newsletter
})
