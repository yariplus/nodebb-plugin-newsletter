import * as NodeBB from './nodebb.js'

let {db, Emailer, User, Group, Meta, Plugins, SioAdmin, async, winston, nconf} = NodeBB

const log = {
  info (msg) { winston.info(`[Newsletter] ${msg}`) },
  warn (msg) { winston.warn(`[Newsletter] ${msg}`) }
}

// Hook: static:app.load
export function load (data, callback) {
  log.info('Initializing Newsletter...')

  const {app, router, middleware} = data

  function getGroups (next) {
    db.getSortedSetRevRange('groups:createtime', 0, -1, (err, groups) => {
      if (err) {
        log.warn(`Failed to load groups: ${err}`)
        return next(err)
      }
      function groupsFilter (group, next) {
        next(false, group.slice(0, 3) !== 'cid' && group !== 'administrators' && group !== 'registered-users')
      }
      function groupsMap (group, next) {
        next(null, {name: group})
      }
      async.waterfall([
        next => {
          async.filter(groups, groupsFilter, (err, _groups) => {
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
    let count = 0

    // Do all the things.
    async.waterfall([
      next => {
        // Send an alert.
        log.info(`UID ${socket.uid} is attempting to send a newsletter.`)

        // Set the correct group.
        data.group = data.group === 'everyone' ? 'users:joindate' : `group:${data.group}:members`
        log.info(`Sending to group "${data.group}"`)

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
            log.warn(`UID ${user.uid} has invalid data, skipping.`)
            return next(false)
          }

          // Skip banned users and warn.
          if (parseInt(user.banned, 10) === 1) {
            log.info(`UID ${user.uid} is banned, skipping...`)
            return next(false)
          }

          // Skip unsubscribed users.
          if (!parseInt(user.pluginNewsletterSub, 10)) {
            log.info(`UID ${user.uid} is unsubscribed, skipping...`)
            return next(false)
          }

          // User is valid.
          return next(true)
        }, users => {
          count = users.length

          next(null, users)
        })
      },

      (users, next) => {
        // Get the site Title.
        Meta.configs.get('title', (err, title) => {
          if (err) return next(err)

          // Send the emails.
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
          }, next)
        })
      }
    ], err => {
      if (err) {
        log.warn(`Error sending emails:`)
        winston.warn(err)
      } else {
        log.info(`Successfully sent newsletter to ${count} user(s)!`)
      }

      callback(err)
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
                <input type="checkbox" data-property="pluginNewsletterSub"${data.settings.pluginNewsletterSub ? ' checked' : ''}>
                <i class="input-helper"></i>
                [[newsletter:sub]]
                <a name="newsletter"></a>
            </label>
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

export function __interopRequireWildcard (obj) {
  return eval('_interopRequireWildcard')(obj)
}
