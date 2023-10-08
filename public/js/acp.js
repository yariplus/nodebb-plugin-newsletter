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
    let $newsletter = $('#newsletter')
    let $everyone = $('#checkbox-everyone')
    let $custom = $('#custom-groups')
    let $blacklist = $('#newsletter-blacklist')
    let $blacklistCheck = $('#checkbox-blacklist')
    let $blacklistForm = $('#newsletter-blacklist-form')

    // Fade custom groups on page load or 'everyone' toggle.
    function displayCustomGroups () {
      if ($everyone[0].checked) {
        $custom.fadeOut()
      } else {
        $custom.fadeIn()
      }
    }

    // Fade blacklist on option toggle.
    function displayBlacklist () {
      if ($blacklistCheck[0].checked) {
        $blacklistForm.fadeIn()
      } else {
        $blacklistForm.fadeOut()
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
      if ($blacklistCheck[0].checked) $blacklistForm.show()
      if ($everyone[0].checked) $custom.hide()
    }

    // Fade in page on load.
    function setupPage () {
      displayOptions()
      $newsletter.fadeIn()
    }

    $('#newsletter-send').click(() => {
      bootbox.confirm('Are you sure you want to send this newsletter?', okay => {
        if (!okay) return

        let subject = $('#newsletter-subject').val()
        let body = tinymce.activeEditor.getContent()
        let groups = getSelectedGroups()
        let override = $('#checkbox-override')[0].checked
        let blacklist = $blacklistCheck[0].checked ? $blacklist.val().split(/[\n, ]+/).filter(e => e).map(e => e.trim()) : []
        let prefixTitle = $('#checkbox-prefix-title')[0].checked

        if (!groups.length) return app.alertError(new Error('No groups selected.'))

        socket.emit('admin.Newsletter.send', {
          subject,
          body,
          groups,
          override,
          blacklist,
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

    $everyone.on('change', displayCustomGroups)
    $blacklistCheck.on('change', displayBlacklist)

    // Load saved blacklist.
    socket.emit('admin.Newsletter.getBlacklist', {}, (err, blacklist) => {
      if (!err && blacklist) $blacklist.val(blacklist)
    })

    let templateEditor = new quill('#template-editor', {
      theme: 'snow'
    })

    let newletterEditor = new quill('#newsletter-editor', {
      theme: 'snow'
    })
  }

  return Newsletter
})
