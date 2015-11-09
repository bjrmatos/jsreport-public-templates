var should = require('should')
var path = require('path')
var supertest = require('supertest')
var Reporter = require('jsreport-core').Reporter
var domain = require('domain')

var authOptions = {
  'cookieSession': {
    'secret': 'dasd321as56d1sd5s61vdv32'
  },
  'admin': {
    'username': 'admin',
    'password': 'password'
  }
}

describe('public-templates', function () {
  var reporter

  beforeEach(function (done) {
    reporter = new Reporter({
      rootDirectory: path.join(__dirname, '../'),
      authentication: authOptions
    })

    reporter.init().then(function () {
      process.domain = process.domain || domain.create()
      process.domain.req = {user: {username: 'foouser', _id: 'foouser'}}
      done()
    }).fail(done)
  })

  it('generating read sharing token should add readSharingToken into template', function (done) {
    reporter.documentStore.collection('templates').insert({
      content: 'content', engine: 'none', recipe: 'html', name: 'foo'
    }).then(function (template) {
      return reporter.publicTemplates.generateSharingToken(template.shortid, 'read').then(function (token) {
        should(token).ok
      }).then(function () {
        return reporter.documentStore.collection('templates').find({shortid: template.shortid}).then(function (template) {
          template[0].readSharingToken.should.be.ok
          done()
        })
      })
    }).catch(done)
  })

  it('generating write sharing token should add writeSharingToken into template', function (done) {
    reporter.documentStore.collection('templates').insert({
      content: 'content', engine: 'none', recipe: 'html', name: 'foo'
    }).then(function (template) {
      return reporter.publicTemplates.generateSharingToken(template.shortid, 'write').then(function (token) {
        should(token).ok
      }).then(function () {
        return reporter.documentStore.collection('templates').find({shortid: template.shortid}).then(function (template) {
          template[0].writeSharingToken.should.be.ok
          done()
        })
      })
    }).catch(done)
  })

  it('rendering report should fail when req.options.authorization.readToken not specified', function (done) {
    reporter.documentStore.collection('templates').insert({
      content: 'content', engine: 'none', recipe: 'html', name: 'foo'
    }).then(function (template) {
      process.domain.req = {user: null, url: '/api/report', body: {options: {}}, query: {}}
      return reporter.render({template: {shortid: template.shortid}}).then(function () {
        done(new Error('Rendering report without auth options should fail.'))
      }).catch(function (e) {
        done()
      })
    }).catch(done)
  })

  it('rendering report should fail when req.options.authorization.readToken has invalid token', function (done) {
    reporter.documentStore.collection('templates').insert({
      content: 'content', engine: 'none', recipe: 'html', name: 'foo'
    }).then(function (template) {
      process.domain.req = {
        user: null,
        url: '/api/report',
        body: {options: {authorization: {readToken: 'invalid'}}},
        query: {}
      }
      return reporter.render({
        template: {shortid: template.shortid},
        options: {authorization: {readToken: 'invalid'}}
      }).then(function () {
        done(new Error('Rendering report without auth options should fail.'))
      }).catch(function (e) {
        done()
      })
    }).catch(done)
  })

  it('rendering report should succeed with valid req.options.authorization.readToken', function (done) {
    reporter.documentStore.collection('templates').insert({
      content: 'content', engine: 'none', recipe: 'html', name: 'foo', readSharingToken: 'token'
    }).then(function (template) {
      process.domain.req = {
        user: null,
        url: '/api/report',
        body: {options: {authorization: {readToken: 'token'}}},
        query: {}
      }
      return reporter.render({
        template: {shortid: template.shortid},
        options: {authorization: {readToken: 'token'}}
      }).then(function () {
        done()
      })
    }).catch(done)
  })

  it('rendering report should succeed with valid req.options.authorization.writeToken', function (done) {
    reporter.documentStore.collection('templates').insert({
      content: 'content', engine: 'none', recipe: 'html', name: 'foo', writeSharingToken: 'token'
    }).then(function (template) {
      process.domain.req = {
        user: null,
        url: '/api/report',
        body: {options: {authorization: {writeToken: 'token'}}},
        query: {}
      }
      return reporter.render({
        template: {shortid: template.shortid},
        options: {authorization: {writeToken: 'token'}}
      }).then(function () {
        done()
      })
    }).catch(done)
  })

  it('rendering report with req.options.authorization.grantRead should add token to the template', function (done) {
    reporter.documentStore.collection('templates').insert({
      content: 'content', engine: 'none', recipe: 'html', name: 'foo'
    }).then(function (template) {
      return reporter.render({
        template: {shortid: template.shortid},
        options: {authorization: {grantRead: true}}
      }).then(function () {
        return reporter.documentStore.collection('templates').find({shortid: template.shortid}).then(function (templates) {
          templates[0].readSharingToken.should.be.ok
          done()
        })
      })
    }).catch(done)
  })

  it('rendering report with req.options.authorization.grantWrite should add token to the template', function (done) {
    reporter.documentStore.collection('templates').insert({
      content: 'content', engine: 'none', recipe: 'html', name: 'foo'
    }).then(function (template) {
      return reporter.render({
        template: {shortid: template.shortid},
        options: {authorization: {grantWrite: true}}
      }).then(function () {
        return reporter.documentStore.collection('templates').find({shortid: template.shortid}).then(function (templates) {
          templates[0].writeSharingToken.should.be.ok
          done()
        })
      })
    }).catch(done)
  })
})

describe('public-templates', function () {
  var reporter

  beforeEach(function (done) {
    reporter = new Reporter({
      rootDirectory: path.join(__dirname, '../'),
      authentication: authOptions
    })

    reporter.init().then(function () {
      process.domain = process.domain || domain.create()
      process.domain.req = {user: {username: 'foouser', _id: 'foouser'}}
      done()
    }).fail(done)
  })

  it('/odata/templates without access token should response 401', function (done) {
    supertest(reporter.express.app)
      .get('/odata/templates')
      .expect(401, done)
  })

  it('/odata/templates with access token should response 200', function (done) {
    process.domain.req = {user: {username: 'foo', _id: 'foo'}, query: {}}

    reporter.documentStore.collection('templates').insert({
      content: 'content', engine: 'none', recipe: 'html', name: 'foo', readSharingToken: 'foo'
    }).then(function () {
      process.domain.req.user = null
      supertest(reporter.express.app)
        .get('/odata/templates?access_token=foo')
        .expect(200, done)
    }).catch(done)
  })

  it('/public-templates?access_token=xxx should render template', function (done) {
    process.domain.req = {user: {username: 'foo', _id: 'foo'}, query: {}}

    reporter.documentStore.collection('templates').insert({
      content: 'content', engine: 'none', recipe: 'html', name: 'foo', readSharingToken: 'foo'
    }).then(function () {
      process.domain.req.user = null
      supertest(reporter.express.app)
        .get('/public-templates?access_token=foo')
        .expect(200, done)
    }).catch(done)
  })
})
