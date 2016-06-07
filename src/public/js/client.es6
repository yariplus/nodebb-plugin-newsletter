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
      newsletter-modal-body
    })

    const $newsletter = $('#newsletter')

    $('#newsletter-send').click(() => {
      socket.emit('plugins.Newsletter.send', {
        subject: $('#newsletter-subject').val(),
        template: editor.getValue(),
        group: $('#newsletter-group').val()
      }, success => {
        if (success) {
          app.alert({
            type: 'success',
            alert_id: 'newsletter-send',
            title: 'Newsletter Sent'
          })
        } else {
          app.alert({
            type: 'error',
            alert_id: 'newsletter-send',
            title: 'Error'
          })
        }
      })
    })
  }

  return Newsletter
})
