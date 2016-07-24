/* global socket, config, ajaxify, app */

$(() => {
  //$(window).on('action:topic.tools.load', addHandlers)

  $(window).on('action:composer.loaded', (err, data) => {
    if (data.hasOwnProperty('composerData') && !data.composerData.isMain) {
      // Do nothing, as this is a reply, not a new post
      return
    }

    if (!app.user.isAdmin) return

    const item = $('<li><a href="#"><i class="fa fa-fw fa-newspaper-o"></i> Send as Newsletter</a></li>')
    let dropdownEl = $('#cmp-uuid-' + data.post_uuid + ' .action-bar .dropdown-menu')

    if (!dropdownEl.length) {
      const submitEl = $('#cmp-uuid-' + data.post_uuid + ' .composer-submit')

      submitEl.after('<button type="button" class="btn btn-info dropdown-toggle" data-toggle="dropdown"><span class="caret"></span><span class="sr-only">[[modules:composer.toggle_dropdown]]</span></button>')
      submitEl.after('<ul class="dropdown-menu pull-right" role="menu"></ul>')

      dropdownEl = $('#cmp-uuid-' + data.post_uuid + ' .action-bar .dropdown-menu')
    }

    let groupsHtml = ''
    socket.emit('admin.Newsletter.getGroupsList', {}, (err, data) => {
      if (err) return console.log(`getGroupsList socket err: ${err.message}`)
      groupsHtml = data.html
    })

    if (config['newsletter']) {
      // TODO
    }

    dropdownEl.append(item)

    item.on('click', () => {
      const title = $(`#cmp-uuid-${data.post_uuid}`).find('.title').val() || 'Newsletter Title'
      let body = $(`#cmp-uuid-${data.post_uuid}`).find('.preview').html() || 'Newsletter Body'

      // Append origin to uploaded images/files.
      let port = window.location.port ? `:${window.location.port}` : ''
      let origin = `${window.location.protocol}//${window.location.hostname}${port}`

      body = body.replace(new RegExp(`(href="${config.relative_path})(\/)`, 'gi'), `$1${origin}$2`)
      body = body.replace(new RegExp(`(src="${config.relative_path})(\/)`, 'gi'), `$1${origin}$2`)

      bootbox.dialog({
        title: title,
        message: `${body}<hr>${groupsHtml}`,
        size: 'large',
        buttons: {
          send: {
            label: "Send Newsletter",
            className: "btn-success",
            callback: () => {
              socket.emit('admin.Newsletter.send', {
                subject: title,
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
            }
          },
          cancel: {
            label: "Cancel",
            className: "btn-default",
            callback: () => {}
          }
        }
      })
    })
  })
})
