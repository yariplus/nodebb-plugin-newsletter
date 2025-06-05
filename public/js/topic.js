// nodebb-plugin-newsletter
// Client script.

/* global $, bootbox, socket, config, app */
/* eslint-disable no-useless-escape */

$('document').ready(function () {
  function translate(text, cb) {
    require(['translator'], function (translator) {
      translator.translate(text, cb)
    })
  }
  function alertType(type, message) {
    require(['alerts'], function (alerts) {
      alerts[type](message)
    })
  }
  $(window).on('action:ajaxify.end', function () {
    if (ajaxify.data.template.compose && ajaxify.data.isMain && ajaxify.data.topic) {
      if (!app.user.isAdmin) return
      // seperate composer page
      const actionBar = $('.composer .action-bar')
      addNewsletterDropdown(actionBar)
    }
  })

  $(window).on('action:composer.loaded', function (ev, data) {
    // Return early if it is a reply and not a new topic
    if (data.hasOwnProperty('composerData') && !data.composerData.isMain) return
    if (!app.user.isAdmin) return

    const actionBar = $('.composer[data-uuid="' + data.post_uuid + '"] .action-bar')
    addNewsletterDropdown(actionBar)

    async function openNewsletterModal() {
      const $composer = $('.composer[data-uuid="' + data.post_uuid + '"]')
      const groups = await socket.emit('admin.Newsletter.getGroups')

      let title = $composer.find('.title').val() || 'Newsletter Subject'
      let body = $composer.find('.preview').html() || 'Newsletter Body'

      // Append the full path to uploaded images/files.
      let port = window.location.port ? `:${window.location.port}` : ''
      let origin = `${window.location.protocol}//${window.location.hostname}${port}`

      body = body.replace(new RegExp(`(href="${config.relative_path})(\/)`, 'gi'), `$1${origin}$2`)
      body = body.replace(new RegExp(`(src="${config.relative_path})(\/)`, 'gi'), `$1${origin}$2`)

      require(['benchpress', 'bootbox'], async (benchpress, bootbox) => {
        const message = await benchpress.render('partials/newsletter-modal', {body, groups})

        bootbox.dialog({
          title,
          message,
          size: 'large',
          buttons: {
            send: {
              label: 'Send Newsletter',
              className: 'btn-success',
              callback: async () => {
                let groups = getSelectedGroups()
                let override = $('#checkbox-override')[0].checked
                let blocklist = $blacklistCheck[0].checked ? $blacklist.val().split(/[\n, ]+/).filter(e => e).map(e => e.trim()) : []

                if (!groups.length) {
                  alertType('error', new Error('No groups selected.'))
                  return false
                }

                await socket.emit('admin.Newsletter.send', {subject: title, body, groups, override, blocklist})
                // TODO: return info

                alertType('success', 'Newsletter Sent')
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

        // Load saved blacklist.
        socket.emit('admin.Newsletter.getBlacklist', {}, (err, blacklist) => {
          if (!err && blacklist) $blacklist.val(blacklist)
        })

        $everyone.on('change', displayCustomGroups)
        $blacklistCheck.on('change', displayBlacklist)
      })
    }

    function addNewsletterDropdown(actionBar) {
      translate('[[newsletter:send.as.newsletter]]', function (translated) {
        const $container = actionBar.find('.dropdown-menu')

        const item = $('<li><a class="dropdown-item" href="#"><i class="fa fa-fw fa-newspaper-o"></i> ' + translated + '</a></li>')

        item.on('click', openNewsletterModal)

        $container.append(item)
      })
    }
  })
})

