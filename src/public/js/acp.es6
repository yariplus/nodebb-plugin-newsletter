/* global define, $, app, config, socket */

define('admin/plugins/newsletter', [
  'translator',
  'uploader',
  'ace/ext-language_tools'
  ], (translator, uploader) => {
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
      // Append origin to uploaded images/files.
      let body = editor.getValue()
      let port = window.location.port ? `:${window.location.port}` : ''
      let origin = `${window.location.protocol}//${window.location.hostname}${port}`

      body = body.replace(new RegExp(`(href="${config.relative_path})(\/)`, 'gi'), `$1${origin}$2`)
      body = body.replace(new RegExp(`(src="${config.relative_path})(\/)`, 'gi'), `$1${origin}$2`)

      socket.emit('admin.Newsletter.send', {
        subject: $('#newsletter-subject').val(),
        template: body,
        group: $('#newsletter-group').val()
      }, err => {
        if (err) {
          app.alertError(err)
        } else {
          app.alertSuccess('Newsletter Sent')
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

    $('#upload').click(() => {
      uploader.show({route: '/api/post/upload'}, (path) => {
        if (path.match(/png|jpeg|jpg|gif|bmp/)) {
          snipIt('<img src="' + path + '">${0}')()
        } else {
          snipIt('<a href="' + path + '">${0:uploaded file}</a>')()
        }
        setTimeout(() => {
          editor.focus()
        }, 1200)
      })
    })
  }

  return Newsletter
})
