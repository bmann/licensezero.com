var fs = require('fs')
var mustache = require('mustache')
var path = require('path')

var VERSION = require('./waiver/version.json')

var TEMPLATE = path.join(__dirname, 'waiver', 'WAIVER.mustache')

module.exports = function (options, callback) {
  fs.readFile(TEMPLATE, 'utf8', function (error, template) {
    if (error) return callback(error)
    var licensor = options.licensor
    var beneficiary = options.beneficiary
    var product = options.product
    callback(null, mustache.render(
      template,
      {
        version: VERSION,
        beneficiaryName: beneficiary.name,
        beneficiaryJurisdiction: beneficiary.jurisdiction,
        licensorName: licensor.name,
        licensorJurisdiction: licensor.jurisdiction,
        agentName: 'Artless Devices LLC',
        agentJurisdiction: 'US-CA',
        agentWebsite: 'https://licensezero.com',
        productID: product.productID,
        description: product.description,
        repository: product.repository,
        date: options.date,
        term: options.term === 'forever' ? false : options.term
      }
    ))
  })
}

module.exports.version = VERSION
