// nodebb-plugin-newsletter
// Client script.

/* global $, bootbox, socket, config, app */
/* eslint-disable no-useless-escape */

$(window).on('action:composer.loaded', (event, data) => {
  if (!app.user.isAdmin) return // Only Admins can send newsletters.
  if (!data.composerData || !data.composerData.isMain) // This is not a new topic.

  let $item = $('<li><a href="#"><i class="fa fa-fw fa-newspaper-o"></i> Send as Newsletter</a></li>')
  let $composer = $(`#cmp-uuid-${data.post_uuid}`)
  let $dropdown = $composer.find('.action-bar .dropdown-menu')

  // Add a dropdown menu if none exists.
  if (!$dropdown.length) {
    let $submit = $composer.find('.composer-submit')

    $submit.after('<button type="button" class="btn btn-info dropdown-toggle" data-toggle="dropdown"><span class="caret"></span><span class="sr-only">[[modules:composer.toggle_dropdown]]</span></button>')
    $submit.after('<ul class="dropdown-menu pull-right" role="menu"></ul>')

    $dropdown = $composer.find('.action-bar .dropdown-menu')
    $dropdown.append($item)
  }

  // Newsletter modal.
  // TODO: We can probably just get the variables we need and parse client-side.
  socket.emit('admin.Newsletter.getOptionsHtml', {}, (err, optionsHtml) => {
    if (err) return console.log(`getOptionsHtml socket err: ${err.message}`)

    $item.on('click', () => {
      let subject = $composer.find('.title').val() || 'Newsletter Subject'
      let body = $composer.find('.preview').html() || 'Newsletter Body'

      // Append the full path to uploaded images/files.
      let port = window.location.port ? `:${window.location.port}` : ''
      let origin = `${window.location.protocol}//${window.location.hostname}${port}`

      body = body.replace(new RegExp(`(href="${config.relative_path})(\/)`, 'gi'), `$1${origin}$2`)
      body = body.replace(new RegExp(`(src="${config.relative_path})(\/)`, 'gi'), `$1${origin}$2`)

      bootbox.dialog({
        title: subject,
        message: `${body}<hr><div id="newsletter">${optionsHtml}</div>`,
        size: 'large',
        buttons: {
          send: {
            label: 'Send Newsletter',
            className: 'btn-success',
            callback: () => {
              let groups = getSelectedGroups()
              let override = $('#checkbox-override')[0].checked
              let blacklist = $blacklistCheck[0].checked ? $blacklist.val().split(/[\n, ]+/).filter(e => e).map(e => e.trim()) : []

              socket.emit('admin.Newsletter.send', {subject, body, groups, override, blacklist}, err => {
                if (err) {
                  app.alertError(err)
                } else {
                  app.alertSuccess('Newsletter Sent')
                }
              })
            }
          },
          cancel: {
            label: 'Cancel',
            className: 'btn-default',
            callback: () => {}
          }
        }
      })

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

      $everyone.on('change', displayCustomGroups)
      $blacklistCheck.on('change', displayBlacklist)
    })
  })
})
