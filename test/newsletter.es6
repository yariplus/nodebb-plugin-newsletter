const chai = require('chai')
const path = require('path')
const atomus = require('atomus')

const expect = chai.expect

const HOME = ( process.env.TRAVIS_BUILD_DIR ? process.env.TRAVIS_BUILD_DIR : process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'] ) + '/nodebb/'

process.env.NODE_ENV = 'development'

require(path.join(HOME, 'node_modules/nconf')).file({ file: path.join(HOME, 'config.json') })

require.main.require = (module) => {
  switch (module) {
    case './src/database': return require(path.join(HOME, module))
    case './src/emailer': return require(path.join(HOME, module))
    case './src/user': return require(path.join(HOME, module))
    //case './src/groups': return require(path.join(HOME, module))
    case './src/meta': return require(path.join(HOME, module))
    case './src/plugins': return require(path.join(HOME, module))
    case './src/socket.io/plugins': return require(path.join(HOME, module))
    case 'async': return require(path.join(HOME, 'node_modules', module))
    case 'winston': return require(path.join(HOME, 'node_modules', module))
    case 'nconf': return require(path.join(HOME, 'node_modules', module))
  }
}

const NodeBB = require(path.join(__dirname, '../lib/', 'nodebb'))
const Newsletter = require(path.join(__dirname, '../lib/', 'plugin'))

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
})

describe('newsletter', () => {
  describe('server', () => {
    it('should load the newsletter plugin', () => {
      expect(Newsletter).to.have.property('load')
      expect(Newsletter).to.have.property('filterUserGetSettings')
    })
    it('should load user settings if they exist', (done) => {
      Newsletter.filterUserGetSettings({ settings: { pluginNewsletterSub: '1'} }, (err, data) => {
        expect(err, 'error value').to.equal(null)
        expect(data.settings.pluginNewsletterSub, 'subscription setting').to.equal('1')
        done()
      })
    })
    it('should create user settings if they do not exist', (done) => {
      Newsletter.filterUserGetSettings({ settings: { pluginNewsletterSub: void 0 } }, (err, data) => {
        expect(err, 'error value').to.equal(null)
        expect(data.settings.pluginNewsletterSub, 'subscription setting').to.equal('1')
        done()
      })
    })
    it('should add a prefix to log messages', () => {
      expect(Newsletter._prepend('msg')).to.match(/\[Newsletter\] msg/)
    })
  })
  describe('client', () => {
    let browser, htmlStr
    it('should load the mock page acp.html', () => {
      try {
        htmlStr = require('fs').readFileSync('test/mock/acp.html', "utf8")
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
