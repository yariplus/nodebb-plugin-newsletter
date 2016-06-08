/* global define, $, app, config, socket */

define('admin/plugins/newsletter', [
  'translator',
  '/vendor/ace/ext-language_tools.js'
  ], (translator) => {
  const Newsletter = {}

  Newsletter.init = () => {
    const editor = ace.edit('newsletter-template')
    const snippetManager = ace.require("ace/snippets").snippetManager

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

      body = body.replace(new RegExp(`(href="${config.relative_path})(\/uploads\/)`, 'gi'), `$1${origin}$2`)
      body = body.replace(new RegExp(`(src="${config.relative_path})(\/uploads\/)`, 'gi'), `$1${origin}$2`)

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

    function snipIt (snippet) {
      return () => {
        snippetManager.insertSnippet(editor, snippet)
        editor.focus()
      }
    }

    $('#bold').click(snipIt('<b>${0:$SELECTION}</b>'))
    $('#italic').click(snipIt('<i>${0:$SELECTION}</i>'))
    $('#strikethrough').click(snipIt('<s>${0:$SELECTION}</s>'))
    $('#link').click(snipIt('<a href="${0:url}">$SELECTION</a>'))
    $('#image').click(snipIt('<img src="${0:url}">'))
  }

  return Newsletter
})
