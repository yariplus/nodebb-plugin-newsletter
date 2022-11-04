// nodebb-plugin-newsletter
// index

/* eslint-disable comma-dangle */

// Import base modules.
const { db, Emailer, User, Meta, SocketAdmin, winston, nconf, path, jwt, url, util } = require('./nodebb.js')

// Dirty hack
let __prefixTitle = true

// Import emoji-extended active sets module.
let ex
try {
  ex = require(path.join(path.dirname(module.parent.filename), '../node_modules/nodebb-plugin-emoji-extended/lib/sets/active.js'))
} catch (e) {}

// Prettify log output.
const log = {
  info (msg) { winston.info(`[Newsletter] ${msg}`) },
  warn (msg) { winston.warn(`[Newsletter] ${msg}`) },
}

// Hook: static:app.load
exports.load = async data => {
  log.info('Initializing Newsletter...')

  const {app, router, middleware} = data

  // Get the names of all member groups.
  async function getGroups () {
    let groups = await db.getSortedSetRevRange('groups:createtime', 0, -1)

    groups = groups.filter(group => group.slice(0, 3) !== 'cid' && group !== 'administrators' && group !== 'registered-users')

    groups = groups.map(group => ({
      name: group
    }))

    return groups
  }

  // Render admin page.
  async function render (req, res) {
    const groups = await getGroups()

    res.render('admin/plugins/newsletter', {groups})
  }

  router.get('/admin/plugins/newsletter', middleware.admin.buildHeader, render)
  router.get('/api/admin/plugins/newsletter', render)

  router.get('/newsletters/unsubscribe/:token', unsubscribe)

  SocketAdmin.Newsletter = {}

  // The user clicked send on the Newsletter page.
  SocketAdmin.Newsletter.send = async (socket, data) => {
    let { subject, body, groups, override, blacklist, prefixTitle } = data
    let count = 0
    let sets

    // Set the blacklist value.
    if (blacklist.length) db.set('plugin-newsletter:blacklist', blacklist)

    log.info(`UID ${socket.uid} is attempting to send a newsletter.`)

    // Map group names to sets.
    if (groups.indexOf('everyone') !== -1) {
      sets = ['users:joindate']
      groups = 'everyone'
    } else {
      sets = groups.map(name => `group:${name}:members`)
    }

    if (!groups.length) throw new Error('No groups selected.')

    log.info(`Sending newsletter to groups: "${groups}"`)
    log.info(`Getting uids from sets: "${sets}"`)

    // Get the sets uids.
    let uids = await db.getSortedSetUnion({sets, start: 0, stop: -1})

    log.info(`Found uids: "${uids}"`)

    let [users, settings] = await Promise.all([
      User.getUsersFields(uids, ['uid', 'email', 'username', 'userslug', 'banned']),
      User.getMultipleUserSettings(uids)
    ])

    for (const i in users) users[i].subscribed = !!parseInt(settings[i].pluginNewsletterSub, 10)

    users = users.filter(user => {
      // Check for nulls and warn.
      if (!(!!user && user.uid !== void 0 && !!user.email && !!user.username)) {
        log.warn(`UID ${user.uid} has invalid user data, skipping...`)
        return false
      }

      let {uid, email, banned, subscribed} = user

      banned = parseInt(banned, 10) === 1

      // Skip banned users and warn.
      if (banned) {
        log.info(`UID ${uid} is banned, skipping...`)
        return false
      } else

      // Skip unsubscribed users.
      if (!subscribed && !override) {
        log.info(`UID ${uid} is unsubscribed, skipping...`)
        return false
      } else 

      // Skip blacklisted emails.
      if (blacklist.indexOf(email) !== -1) {
        log.info(`UID ${uid} (${email}) is blacklisted, skipping...`)
        return false
      } else {

        return true
      }
    })

    count = users ? users.length : 0

    // Get the site Title.
    let title = await Meta.configs.get('title')

    // TODO: Fix this to actually work properly.
    __prefixTitle = prefixTitle

    log.info(`Sending to users: "${count}"`)

    // Send the emails.
    await Promise.all(users.map(async user => {
      let {uid, username, userslug} = user

      // Email options.
      const options = {
        subject,
        username,
        body: body.replace('{username}', username),
        title,
        userslug,
        url: nconf.get('url'),
        override
      }

      await Emailer.send('newsletter', uid, options)
    }))

    log.info(`Successfully sent newsletter to ${count} user(s)!`)
  }

  // Get groups list for in-topic sending.
  SocketAdmin.Newsletter.getGroups = async (socket, data) => {
     return await getGroups()
  }

  // Import emoji-extended sets.
  SocketAdmin.Newsletter.getSmileys = (socket, data, callback) => {
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

  SocketAdmin.Newsletter.getBlacklist = (socket, data, next) => {
    db.get('plugin-newsletter:blacklist', next)
  }
}

exports.filterEmailModify = (data, next) => {
  if ((data.template === 'newsletter' || data.template === 'newsletter_plaintext')) {
    // A stupid hack.
    if (!__prefixTitle) data.subject = data.subject.replace(`[${Meta.config.title}] `, '')
  }

  return next(null, data)
}

exports.filterEmailParams = (data, next) => {
  if ((data.template === 'newsletter' || data.template === 'newsletter_plaintext')) {
    let payload = {
      template: data.template,
      uid: data.params.uid,
      type: 'newsletters',
    }

    payload = jwt.sign(payload, nconf.get('secret'), {
      expiresIn: '30d',
    })

    const unsubUrl = [nconf.get('url'), 'newsletters', 'unsubscribe', payload].join('/')

    const getHostname = () => {
      const configUrl = nconf.get('url')
      const parsed = url.parse(configUrl)
      return parsed.hostname
    }

    data.params.headers = {
      'List-Id': '<' + [data.template, data.params.uid, getHostname()].join('.') + '>',
      'List-Unsubscribe': '<' + unsubUrl + '>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      ...data.params.headers,
    }

    data.params.unsubUrl = unsubUrl
  }

  return next(null, data)
}

exports.adminHeader = (customHeader, callback) => {
  customHeader.plugins.push({
    route: '/plugins/newsletter',
    icon: 'fa-newspaper-o ',
    name: 'Newsletter'
  })

  callback(null, customHeader)
}

exports.filterUserCustomSettings = (data, next) => {
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

exports.filterUserGetSettings = (data, next) => {
  if (data.settings.pluginNewsletterSub === void 0) data.settings.pluginNewsletterSub = '1'

  next(null, data)
}

exports.actionSaveSettings = (data, next) => {
  db.setObjectField(`user:${data.uid}:settings`, 'pluginNewsletterSub', data.settings.pluginNewsletterSub, next)
}

const jwtVerifyAsync = util.promisify(function (token, callback) {
  jwt.verify(token, nconf.get('secret'), (err, payload) => callback(err, payload))
})

const unsubscribe = async (req, res) => {
	let payload

	try {
		payload = await jwtVerifyAsync(req.params.token)
		if (!payload) {
			return
		}
	} catch (err) {
		throw new Error(err)
	}

	try {
		await db.setObjectField(`user:${payload.uid}:settings`, 'pluginNewsletterSub', 0)
		res.render('unsubscribe', { payload })
	} catch (err) {
		throw new Error(err)
	}
}

