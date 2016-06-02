import * as NodeBB from './nodebb.js'

let {db, Emailer, User, Group, Meta, Plugins, SioPlugins, async, winston, nconf} = NodeBB

function prepend (msg) { return `[Newsletter] ${msg}` }

// Hook: static:app.load
export function load (data, callback) {
  winston.info(prepend('Initializing Newsletter...'))

  const router = data.router
  const middleware = data.middleware

  function render (req, res, next) {
    async.parallel({
      groups (next) {
        db.getSortedSetRevRange('groups:createtime', 0, -1, (err, groups) => {
          if (err) {
            winston.warn(`[Newsletter] Failed to load groups: ${err}`)
            return next(err)
          }
          function groupsFilter (group, next) {
            next(group.slice(0, 3) !== 'cid' && group !== 'administrators' && group !== 'registered-users')
          }
          function groupsMap (group, next) {
            next(null, {name: group})
          }
          async.waterfall([
            next => {
              async.filter(groups, groupsFilter, _groups => {
                next(null, _groups)
              })
            },
            (_groups, next) => {
              async.map(_groups, groupsMap, next)
            }
          ], next)
        })
      },
      formatting (next) {
        Plugins.fireHook('filter:composer.formatting', {
          options: [
            { name: 'tags', className: 'fa fa-tags', mobile: true }
          ]
        }, (err, payload) => {
          next(err, payload.options)
        })
      }
    },
    (err, payload) => {
      if (!err) {
        res.render('admin/plugins/newsletter', payload)
      } else {
        res.send(`Error: ${err}`)
      }
    })
  }

  router.get('/admin/plugins/newsletter', middleware.admin.buildHeader, render)
  router.get('/api/admin/plugins/newsletter', render)

  SioPlugins.Newsletter = { }

  // The user clicked send on the Newsletter page.
  SioPlugins.Newsletter.send = (socket, data, callback) => {
    // Do all the things.
    async.waterfall([

      // Make sure the user is an admin.
      async.apply(User.isAdministrator, socket.uid),
      (isAdmin, next) => {
        // Do a warning if the user is not an admin.
        if (isAdmin) {
          winston.info(`[Newsletter] uid ${socket.uid} sent a newsletter.`)
        } else {
          winston.warn(`[socket.io] Call to admin method ( plugins.Newsletter.send ) blocked (accessed by uid ${socket.uid})`)
          return next(new Error('[[error:not_admin]]'))
        }

        // Set the correct group.
        if (data.group === 'everyone') {
          data.group = 'users:joindate'
        } else {
          data.group = `group:${data.group}:members`
        }
        winston.info(`[Newsletter] Sending to group "${data.group}".`)
        return next()
      },

      next => {
        db.getSortedSetRange(data.group, 0, -1, next)
      },
      (uids, next) => {
        async.parallel({
          fields: async.apply(User.getUsersFields, uids, ['uid', 'email', 'username', 'userslug', 'banned']),
          settings: async.apply(User.getMultipleUserSettings, uids)
        }, (err, results) => {
          if (err) return next(err)
          for (const i in results.fields) {
            results.fields[i].pluginNewsletterSub = results.settings[i].pluginNewsletterSub
          }
          next(null, results.fields)
        })
      },

      (users, next) => {
        async.filter(users, (user, next) => {
          // Check for nulls and warn.
          if (!(!!user && user.uid !== void 0 && !!user.email && !!user.username)) {
            winston.warn(`[Newsletter] Null data at uid ${user.uid}, skipping.`)
            return next(false)
          }

          // Skip banned users and warn.
          if (parseInt(user.banned, 10) === 1) {
            winston.warn(`[Newsletter] Banned user at uid ${user.uid}, skipping.`)
            return next(false)
          }

          // Skip unsubscribed users.
          if (!parseInt(user.pluginNewsletterSub, 10)) {
            winston.warn(`[Newsletter] Unsubscribed user at uid ${user.uid}, skipping.`)
            return next(false)
          }

          // User is valid.
          return next(true)
        }, users => {
          next(null, users)
        })
      },
      (users, next) => {
        // Get the site Title.
        Meta.configs.get('title', (err, title) => {
          if (err) return next(err)

          // Send the emails.
          winston.info(`[Newsletter] Sending email newsletter to ${users.length} users: `)
          async.eachLimit(users, 100, (userObj, next) => {
            // Email options.
            const options = {
              subject: data.subject,
              username: userObj.username,
              body: data.template.replace('{username}', userObj.username),
              title,
              userslug: userObj.userslug,
              url: nconf.get('url')
            }

            Emailer.send('newsletter', userObj.uid, options, next)

            // We're done.
          }, err => {
            winston.info(`[Newsletter] Finished email loop with error value: ${err}`)
            next(err)
          })
        })
      }
    ], err => {
      winston.info('[Newsletter] Done sending emails.')

      // Returns true if there were no errors.
      if (err) {
        winston.warn(`[Newsletter] Error sending emails: ${err.message || err}`)
        callback(false)
      } else {
        callback(true)
      }

      winston.info(`[Newsletter] Finished main loop with error value: ${err}`)
    })
  }

  // End of app.load
  callback()
}

export function adminHeader (customHeader, callback) {
  customHeader.plugins.push({
    route: '/plugins/newsletter',
    icon: 'fa-newspaper-o ',
    name: 'Newsletter'
  })

  callback(null, customHeader)
}

export function filterUserCustomSettings (data, next) {
  // {settings: results.settings, customSettings: [], uid: req.uid}
  data.settings.pluginNewsletterSub = data.settings.pluginNewsletterSub !== void 0 ? parseInt(data.settings.pluginNewsletterSub, 10) === 1 : true

  data.customSettings.push({
    title: '[[newsletter:sub-setting]]',
    content: `
        <div class="checkbox">
            <label>
                <input type="checkbox" data-property="pluginNewsletterSub"${data.settings.pluginNewsletterSub ? ' checked' : ''}> <strong>[[newsletter:sub]]</strong>
            </label>
            <a name="newsletter"></a>
        </div>`
  })

  next(null, data)
}

export function filterUserGetSettings (data, next) {
  if (data.settings.pluginNewsletterSub === void 0) data.settings.pluginNewsletterSub = '1'

  next(null, data)
}

export function actionSaveSettings (data, next) {
  db.setObjectField(`user:${data.uid}:settings`, 'pluginNewsletterSub', data.settings.pluginNewsletterSub)
}
