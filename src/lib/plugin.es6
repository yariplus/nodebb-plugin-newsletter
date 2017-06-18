// nodebb-plugin-newsletter

// Import base modules.
import {db, Emailer, User, Meta, Plugins, SioAdmin, async, winston, nconf, path} from './nodebb.js'

// Import emoji-extended active sets module.
let ex
try {
  ex = require(path.join(path.dirname(module.parent.filename), '../node_modules/nodebb-plugin-emoji-extended/lib/sets/active.js'))
} catch (e) {}

// Prettify log output.
const log = {
  info (msg) { winston.info(`[Newsletter] ${msg}`) },
  warn (msg) { winston.warn(`[Newsletter] ${msg}`) }
}

// Hook: static:app.load
export function load (data, callback) {
  log.info('Initializing Newsletter...')

  const {app, router, middleware} = data

  // Get the names of all memeber groups.
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

  // Render admin page.
  function render (req, res, next) {
    getGroups ((err, groups) => {
      if (!err) {
        res.render('admin/plugins/newsletter', {groups})
      } else {
        res.send(`Error: ${err}`)
      }
    })
  }

  router.get('/admin/plugins/newsletter', middleware.admin.buildHeader, render)
  router.get('/api/admin/plugins/newsletter', render)

  SioAdmin.Newsletter = {}

  // The user clicked send on the Newsletter page.
  SioAdmin.Newsletter.send = (socket, data, callback) => {
    let {subject, body, groups, override, blacklist} = data
    let count = 0, sets

    // Do all the things.
    async.waterfall([
      next => {
        // Send an alert.
        log.info(`UID ${socket.uid} is attempting to send a newsletter.`)

        // Map group names to sets.
        if (groups.indexOf('everyone') !== -1) {
          sets = ['users:joindate']
          groups = 'everyone'
        } else {
          sets = groups.map(name => `group:${name}:members`)
        }

        log.info(`Sending newsletter to groups: "${groups}"`)

        // Get the sets uids.
        db.getSortedSetUnion({sets, start: 0, stop: -1}, next)
      },

      (uids, next) => {
        async.parallel({
          fields: async.apply(User.getUsersFields, uids, ['uid', 'email', 'username', 'userslug', 'banned']),
          settings: async.apply(User.getMultipleUserSettings, uids)
        }, (err, results) => {
          if (err) return next(err)
          for (const i in results.fields) {
            results.fields[i].subscribed = !!parseInt(results.settings[i].pluginNewsletterSub, 10)
          }
          next(null, results.fields)
        })
      },

      (users, next) => {
        async.filter(users, (user, next) => {
          // Check for nulls and warn.
          if (!(!!user && user.uid !== void 0 && !!user.email && !!user.username)) {
            log.warn(`UID ${user.uid} has invalid user data, skipping...`)
            return next(null, false)
          }

          let {uid, email, banned, subscribed} = user

          // Skip banned users and warn.
          if (banned) {
            log.info(`UID ${uid} is banned, skipping...`)
            return next(null, false)
          }

          // Skip unsubscribed users.
          if (!subscribed && !override) {
            log.info(`UID ${uid} is unsubscribed, skipping...`)
            return next(null, false)
          }

          // Skip blacklisted emails.
          if (blacklist.indexOf(email) !== -1) {
            log.info(`UID ${uid} (${email}) is blacklisted, skipping...`)
            return next(null, false)
          }

          // User is valid.
          next(null, true)
        }, (err, users) => {
          count = users ? users.length : 0

          // Get the site Title.
          Meta.configs.get('title', (err, title) => {
            if (err) return next(err)

            // Send the emails.
            async.eachLimit(users, 100, (userObj, next) => {
              let {uid, username, userslug} = userObj

              // Email options.
              const options = {
                subject,
                username,
                body: body.replace('{username}', username),
                title,
                userslug,
                url: nconf.get('url'),
              }

              Emailer.send('newsletter', uid, options, next)

              // We're done.
            }, next)
          })
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

  // Render groups list for in-topic sending.
  SioAdmin.Newsletter.getGroupsList = (socket, data, callback) => {
    getGroups((err, groups) => {
      app.render('partials/newsletter-groups', {groups}, (err, html) => {
        callback(err, {html})
      })
    })
  }

  // Import emoji-extended sets.
  SioAdmin.Newsletter.getSmileys = (socket, data, callback) => {
    if (!ex || !ex.sets.length) return callback(null, [[]])

    let smileys = []

    ex.sets.forEach(set => {
      let sSet = []
      let sPath = ex.urls[set.id][0]
      let sExt = ex.urls[set.id][2]

      set.list.forEach(img => {
        let url = sPath + img.file + sExt
        let title = img.id

        sSet.push({url, title})
      })

      smileys.push(sSet)
    })

    callback(null, smileys)
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

// Hack for ES6 coverage.
export function __interopRequireWildcard (obj) {
  return eval('_interopRequireWildcard')(obj)
}
