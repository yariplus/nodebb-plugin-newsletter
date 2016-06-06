const chai = require('chai')
const path = require('path')
const atomus = require('atomus')
const fs = require('fs')

const expect = chai.expect

// Find the NodeBB install dir.
const HOME = ( process.env.TRAVIS_BUILD_DIR ? process.env.TRAVIS_BUILD_DIR : process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'] ) + '/nodebb/'

process.env.NODE_ENV = 'development'

// Load the config file to nconf.
require(path.join(HOME, 'node_modules/nconf')).file({ file: path.join(HOME, 'config.json') })

require.main.require = module => {
  switch (module) {
    case './src/database': return require(path.join(HOME, module))
    case './src/emailer': return require(path.join(HOME, module))
    case './src/user': return require(path.join(HOME, module))
    //case './src/groups': return require(path.join(HOME, module))
    case './src/meta': return require(path.join(HOME, module))
    case './src/plugins': return require(path.join(HOME, module))
    case './src/socket.io/plugins': return require(path.join(HOME, module))
    case 'async': return require(path.join(HOME, 'node_modules', module))
    case 'winston': return {info: () => {}, warn: () => {}}
    case 'nconf': return require(path.join(HOME, 'node_modules', module))
  }
}

const NodeBB = require(path.join(__dirname, '../lib/', 'nodebb'))
const Newsletter = require(path.join(__dirname, '../lib/', 'plugin'))

it('should load ES6 modules', () => {
  Newsletter.__interopRequireWildcard(null, (obj) => {
    expect(obj).to.not.exist
  })
  let obj = function () {
    this.test = true
  }
  obj.prototype.test2 = true;
  Newsletter.__interopRequireWildcard(new obj(), (obj) => {
    expect(obj).to.exist
  })
})

describe('nodebb', () => {
  it('should load the modules', () => {
    expect(NodeBB).to.have.property('db')
    expect(NodeBB).to.have.property('Emailer')
    expect(NodeBB).to.have.property('User')
    //expect(NodeBB).to.have.property('Group')
    expect(NodeBB).to.have.property('Meta')
    expect(NodeBB).to.have.property('Plugins')
    expect(NodeBB).to.have.property('SioPlugins')
    expect(NodeBB).to.have.property('async')
    expect(NodeBB).to.have.property('winston')
    expect(NodeBB).to.have.property('nconf')
  })
  it('should initialize the database', (done) => {
    NodeBB.db.init(() => {
      expect(NodeBB.db).to.have.property('sortedSetRemove')
      done()
    })
  })
})

describe('newsletter', () => {
  describe('server', () => {
    it('should load the newsletter plugin', () => {
      expect(Newsletter).to.have.property('load')
      expect(Newsletter).to.have.property('filterUserGetSettings')
    })
    it('should load user settings if they exist', (done) => {
      Newsletter.filterUserGetSettings({ settings: { pluginNewsletterSub: '1'} }, (err, data) => {
        expect(err, 'error value').to.not.exist
        expect(data.settings.pluginNewsletterSub, 'subscription setting').to.equal('1')
        done()
      })
    })
    it('should create user settings if they do not exist', (done) => {
      Newsletter.filterUserGetSettings({ settings: { pluginNewsletterSub: void 0 } }, (err, data) => {
        expect(err, 'error value').to.not.exist
        expect(data.settings.pluginNewsletterSub, 'subscription setting').to.equal('1')
        done()
      })
    })
    it('should add a prefix to log messages', () => {
      expect(Newsletter._prepend('msg')).to.match(/\[Newsletter\] msg/)
    })
    it('should save user settings', (done) => {
      const settings = {
        uid: 'test',
        settings: {
          pluginNewsletterSub: '1'
        }
      }
      const key = `user:${settings.uid}:settings`
      NodeBB.db.deleteObjectField(key, 'pluginNewsletterSub', () => {
        Newsletter.actionSaveSettings(settings, () => {
          NodeBB.db.getObjectField(key, 'pluginNewsletterSub', (err, setting) => {
            expect(err, 'error value').to.not.exist
            expect(setting, 'subscription setting').to.equal('1')
            done()
          })
        })
      })
    })
    it('should filter nonexisting user settings', () => {
      Newsletter.filterUserCustomSettings({settings: {}, customSettings: []}, (err, data) => {
        expect(err, 'error value').to.not.exist
        expect(data, 'return value').to.exist
        expect(data.settings.pluginNewsletterSub, 'newsletter settings value').to.be.a('boolean')
        expect(data.settings.pluginNewsletterSub, 'newsletter settings value').to.be.true
        expect(data.customSettings[0]).to.exist
        expect(data.customSettings[0]).to.be.a('object')
        expect(data.customSettings[0]['title']).to.be.a('string')
        expect(data.customSettings[0]['content']).to.be.a('string')
      })
    })
    it('should filter existing user settings', () => {
      Newsletter.filterUserCustomSettings({settings: { pluginNewsletterSub: '1' }, customSettings: []}, (err, data) => {
        expect(err, 'error value').to.not.exist
        expect(data, 'return value').to.exist
        expect(data.settings.pluginNewsletterSub, 'newsletter settings value').to.be.a('boolean')
        expect(data.settings.pluginNewsletterSub, 'newsletter settings value').to.be.true
        expect(data.customSettings[0]).to.exist
        expect(data.customSettings[0]).to.be.a('object')
        expect(data.customSettings[0]['title']).to.be.a('string')
        expect(data.customSettings[0]['content']).to.be.a('string')
      })
      Newsletter.filterUserCustomSettings({settings: { pluginNewsletterSub: '0' }, customSettings: []}, (err, data) => {
        expect(err, 'error value').to.not.exist
        expect(data, 'return value').to.exist
        expect(data.settings.pluginNewsletterSub, 'newsletter settings value').to.be.a('boolean')
        expect(data.settings.pluginNewsletterSub, 'newsletter settings value').to.be.false
        expect(data.customSettings[0]).to.exist
        expect(data.customSettings[0]).to.be.a('object')
        expect(data.customSettings[0]['title']).to.be.a('string')
        expect(data.customSettings[0]['content']).to.be.a('string')
      })
    })
    it('should initialize the plugin', () => {
      let app = {
        router: {
          get: () => {}
        },
        middleware: {
          admin: {
            buildHeader: (req, res, next) => { next() }
          }
        }
      }

      expect(() => { Newsletter.load(app, () => {}) }).to.not.throw(Error)
    })
  })
  describe('client', () => {
    let browser, htmlStr

    it('should load the mock page acp.html', () => {
      try {
        htmlStr = fs.readFileSync('test/mock/acp.html', "utf8")
      } catch (err) {}
      expect(htmlStr).to.exist
    })
    it('should load a mock browser', function (done) {
      this.timeout(10000) // This can sometimes take a long time because reasons.
      let browser = atomus().html(htmlStr).ready((errors, window) => {
        expect(window).to.exist
        done()
      })
    })
  })
})
