// nodebb-plugin-newsletter
// Admin script.

/* global define, $, app, socket, tinymce, bootbox */

define('admin/plugins/newsletter', [
  'quill',
  'settings',
  'alerts',
  'translator',
  'uploader',
], (quill, settings, alerts, translator, uploader) => {
  const Newsletter = {}

  Newsletter.init = () => {
    let $everyone = $('#checkbox-everyone')
    let $custom = $('#custom-groups')
    let $blocklistGlobalText = $('#email-global-blocklist')
    let $blocklistCheck = $('#use-blocklist')
    let $blocklistText = $('#email-blocklist')
    let $blocklistDiv = $('#email-blocklist-div')

    // Fade custom groups on page load or 'everyone' toggle.
    function displayCustomGroups () {
      if ($everyone[0].checked) {
        $custom.fadeOut()
      } else {
        $custom.fadeIn()
      }
    }

    // Fade blocklist on option toggle.
    function displayBlocklist () {
      if ($blocklistCheck[0].checked) {
        $blocklistDiv.fadeIn()
      } else {
        $blocklistDiv.fadeOut()
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

    // Display options on page load.
    function displayOptions () {
      if ($blocklistCheck[0].checked) $blocklistDiv.show()
      //if ($everyone[0].checked) $custom.hide()
    }

    // Fade in page on load.
    function setupPage () {
      displayOptions()
      //$newsletter.fadeIn()
    }

    $('#newsletter-send').click(() => {
      bootbox.confirm('Are you sure you want to send this newsletter?', okay => {
        if (!okay) return

        let subject = $('#newsletter-subject').val()
        let body = tinymce.activeEditor.getContent()
        let groups = getSelectedGroups()
        let override = $('#checkbox-override')[0].checked
        let blocklist = $blocklistCheck[0].checked ? $blocklist.val().split(/[\n, ]+/).filter(e => e).map(e => e.trim()) : []
        let prefixTitle = $('#checkbox-prefix-title')[0].checked

        if (!groups.length) return app.alertError(new Error('No groups selected.'))

        socket.emit('admin.Newsletter.send', {
          subject,
          body,
          groups,
          override,
          blocklist,
          prefixTitle,
        }, err => {
          if (err) {
            app.alertError(err)
          } else {
            app.alertSuccess('Newsletter Sent Successfully!')
          }
        })
      })
    })

    // Load saved blocklist.
    socket.emit('admin.Newsletter.getBlocklist', {}, (err, blocklist) => {
      if (!err && blocklist) $blocklist.val(blocklist)
    })

    let templateEditor = new quill('#template-editor', {
      theme: 'snow'
    })

    let newletterEditor = new quill('#newsletter-editor', {
      theme: 'snow'
    })

    $everyone.on('change', displayCustomGroups)
    $blocklistCheck.on('change', displayBlocklist)
    setupPage()
  }

  return Newsletter
})
