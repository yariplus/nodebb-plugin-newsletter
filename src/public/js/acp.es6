/* global define, $, app, config, socket */

define('admin/plugins/newsletter', ['translator'], (translator) => {
  const Newsletter = {}

  Newsletter.init = () => {
    const editor = ace.edit('newsletter-template')

    editor.setTheme('ace/theme/twilight')
    editor.getSession().setMode('ace/mode/html')

    $('#newsletter-preview').click(() => {
      $('#newsletter-modal-subject').html($('#newsletter-subject').val())
      $('#newsletter-modal-body').html(editor.getValue())
    })

    const $newsletter = $('#newsletter')

    $('#newsletter-send').click(() => {
      // TODO: DRY these methods.
      // Append origin to uploaded images/files.
      let body = editor.getValue()
      let port = window.location.port ? `:${window.location.port}` : ''
      let origin = `${window.location.protocol}//${window.location.hostname}${port}`

      body = body.replace(/(href=")(\/uploads\/)/gi, `$1${origin}$2`)
      body = body.replace(/(src=")(\/uploads\/)/gi, `$1${origin}$2`)

      socket.emit('admin.Newsletter.send', {
        subject: $('#newsletter-subject').val(),
        template: body,
        group: $('#newsletter-group').val()
      }, success => {
        if (success) {
          app.alert({
            type: 'success',
            alert_id: 'newsletter-send',
            title: 'Newsletter Sent',
            timeout: 5000
          })
        } else {
          app.alert({
            type: 'error',
            alert_id: 'newsletter-send',
            title: 'Error',
            timeout: 5000
          })
        }
      })
    })
  }

  return Newsletter
})
