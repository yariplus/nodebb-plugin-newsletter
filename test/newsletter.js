const chai = require('chai')
const path = require('path')

chai.should();

let Newsletter = require(path.join(__dirname, '..', 'library'));

describe('newsletter', () => {
  describe('sending a newletter', () => {
    it('should send a newsletter', () => {
      newsletter.should.equal(true)
    })
  })
})
