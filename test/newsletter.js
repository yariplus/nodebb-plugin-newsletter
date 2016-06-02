const chai = require('chai')
const path = require('path')
const mock = require('mock-require')

mock('../lib/nodebb', {
  db: {},
  Emailer: {},
  User: {},
  Group: {},
  Meta: {},
  Plugins: {},
  SioPlugins: {},
  async: {},
  winston: {},
  nconf: {}
});

chai.should();

let Newsletter = require(path.join(__dirname, '../lib/', 'plugin'))

describe('newsletter', () => {
  describe('loading newletter', () => {
    it('should init the newsletter plugin', () => {
      Newsletter.should.have.property('load')
    })
  })
})
