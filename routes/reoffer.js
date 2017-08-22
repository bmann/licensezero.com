var UUIDV4 = require('../data/uuidv4-pattern')
var checkRepository = require('./check-repository')
var clone = require('../data/clone')
var ecb = require('ecb')
var fs = require('fs')
var mkdirp = require('mkdirp')
var path = require('path')
var productPath = require('../paths/product')
var runSeries = require('run-series')
var without = require('../data/without')

var schema = exports.schema = clone(require('./offer').schema)
schema.properties.product = {
  type: 'string',
  pattern: UUIDV4
}
schema.required.push('product')

exports.handler = function (body, service, end, fail, lock) {
  var product = body.product
  lock(product, function (release) {
    var file = productPath(service, body.id, product)
    runSeries([
      function checkThatProductExists (done) {
        fs.stat(file, function (error) {
          if (error && error.code === 'ENOENT') {
            error.userMessage = 'no such product'
          }
          done(error)
        })
      },
      checkRepository.bind(null, body),
      function writeProductFile (done) {
        var content = without(body, 'licensor')
        runSeries([
          mkdirp.bind(null, path.dirname(file)),
          fs.writeFile.bind(fs, file, JSON.stringify(content))
        ], ecb(done, done.bind(null, null, product)))
      }
    ], release(function (error, product) {
      if (error) {
        service.log.error(error)
        fail(error.userMessage || 'internal error')
      } else {
        end({product: product})
      }
    }))
  })
}
