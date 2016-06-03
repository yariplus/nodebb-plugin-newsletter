const chai = require('chai')
const path = require('path')
const mock = require('mock-require')

const HOME = process.env.NODEBB_HOME || process.env.HOME + '/nodebb/'

require(path.join(HOME, 'node_modules/nconf')).file({ file: path.join(HOME, 'config.json') })

require.main.require = (module) => {
  console.log(`Requiring module: ${module}`)
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

chai.should()

let NodeBB = require(path.join(__dirname, '../lib/', 'nodebb'))
let Newsletter = require(path.join(__dirname, '../lib/', 'plugin'))

describe('nodebb', () => {
  describe('loading nodebb', () => {
    it('should load the modules', () => {
      NodeBB.should.have.property('db')
      NodeBB.should.have.property('Emailer')
      NodeBB.should.have.property('User')
      //NodeBB.should.have.property('Group')
      NodeBB.should.have.property('Meta')
      NodeBB.should.have.property('Plugins')
      NodeBB.should.have.property('SioPlugins')
      NodeBB.should.have.property('async')
      NodeBB.should.have.property('winston')
      NodeBB.should.have.property('nconf')
    })
  })
})
describe('newsletter', () => {
  describe('loading newletter', () => {
    it('should init the newsletter plugin', () => {
      Newsletter.should.have.property('load')
    })
  })
})
