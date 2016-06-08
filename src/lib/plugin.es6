import * as NodeBB from './nodebb.js'

let {db, Emailer, User, Group, Meta, Plugins, SioAdmin, async, winston, nconf} = NodeBB

function prepend (msg) { return `[Newsletter] ${msg}` }

// Hook: static:app.load
export function load (data, callback) {
  winston.info(prepend('Initializing Newsletter...'))

  const {app, router, middleware} = data

  function getGroups (next) {
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
  }

  function render (req, res, next) {
    getGroups ((err, groups) => {
      if (!err) {
        res.render('admin/plugins/newsletter', {groups: groups})
      } else {
        res.send(`Error: ${err}`)
      }
    })
  }

  router.get('/admin/plugins/newsletter', middleware.admin.buildHeader, render)
  router.get('/api/admin/plugins/newsletter', render)

  SioAdmin.Newsletter = { }

  // The user clicked send on the Newsletter page.
  SioAdmin.Newsletter.send = (socket, data, callback) => {
    // Do all the things.
    async.waterfall([
      next => {
        // Send an alert.
        winston.info(prepend(`uid ${socket.uid} is attempting to send a newsletter.`))

        // Set the correct group.
        data.group = data.group === 'everyone' ? 'users:joindate' : `group:${data.group}:members`
        winston.info(`[Newsletter] Sending to group "${data.group}".`)

        // Get the group uids.
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

  SioAdmin.Newsletter.getGroupsList = (socket, data, callback) => {
    getGroups((err, groups) => {
      const html = app.render('partials/newsletter-groups', {groups: groups}, (err, html) => {
        callback(null, {html: html})
      })
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
  db.setObjectField(`user:${data.uid}:settings`, 'pluginNewsletterSub', data.settings.pluginNewsletterSub, next)
}

const dev = process.env.NODE_ENV === 'development'

export function _prepend (text) {
  return prepend(text)
}
export function __interopRequireWildcard (obj) {
  return eval('_interopRequireWildcard')(obj)
}
