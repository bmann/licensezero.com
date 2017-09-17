var AJV = require('ajv')
var Busboy = require('busboy')
var TIERS = require('../data/private-license-tiers')
var UUIDV4 = require('../data/uuidv4-pattern')
var applicationFee = require('../stripe/application-fee')
var capitalize = require('./capitalize')
var ed25519 = require('../ed25519')
var escape = require('./escape')
var footer = require('./partials/footer')
var formatPrice = require('./format-price')
var fs = require('fs')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var internalError = require('./internal-error')
var mkdirp = require('mkdirp')
var nav = require('./partials/nav')
var orderPath = require('../paths/order')
var padStart = require('string.prototype.padstart')
var path = require('path')
var pick = require('../data/pick')
var privateLicense = require('../forms/private-license')
var purchasePath = require('../paths/purchase')
var readJSONFile = require('../data/read-json-file')
var recordAcceptance = require('../data/record-acceptance')
var recordSignature = require('../data/record-signature')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var runWaterfall = require('run-waterfall')
var stringify = require('../stringify')
var uuid = require('uuid/v4')

var ONE_DAY = 24 * 60 * 60 * 1000
var UUID_RE = new RegExp(UUIDV4)

module.exports = function (request, response, service) {
  var method = request.method
  if (method === 'GET' || method === 'POST') {
    var orderID = request.parameters.order
    if (!UUID_RE.test(orderID)) return notFound(response)
    var file = orderPath(service, orderID)
    readJSONFile(file, function (error, order) {
      if (error) {
        if (error.code === 'ENOENT') return notFound(response)
        service.log.error(error)
        internalError(response)
      } else if (expired(order.date)) {
        return notFound(response)
      }
      (method === 'GET' ? get : post)(request, response, service, order)
    })
  } else {
    response.statusCode = 405
    response.end()
  }
}

function get (request, response, service, order, postData) {
  response.statusCode = postData ? 400 : 200
  response.setHeader('Content-Type', 'text/html')
  response.end(html`
<!doctype html>
<html lang=en>
${head('Buy Licenses')}
<body>
  ${nav()}
  ${header()}
  <main>
    <section>
      <h2>Licensee</h2>
      <dl>
        <dt>Legal Name</dt><dd>${escape(order.licensee)}</dd>
        <dt>Jurisdiction</dt><dd>[${escape(order.jurisdiction)}]</dd>
      </dl>
    </section>
    <section>
      <table class=invoice>
        <thead>
          <tr>
            <th>License</th>
            <th class=price>Price (USD)</th>
          </tr>
        </thead>
        <tbody>
        ${order.projects.map(function (project) {
          return html`
            <tr>
              <td>
                <p><code>${escape(project.projectID)}</code></p>
                <p>${escape(project.description)}</p>
                <p>
                  <a
                    href="${escape(project.repository)}"
                    target=_blank
                    >${escape(project.repository)}</a>
                </p>
                <p>
                  ${escape(project.licensor.name)}
                  [${escape(project.licensor.jurisdiction)}]
                </p>
                <p>
                  <a
                    href="/licenses/private#${order.tier}"
                    target=_blank
                  >${escape(capitalize(order.tier))} License</a>:
                  ${
                    order.tier === 'solo'
                      ? 'one user'
                      : TIERS[order.tier] + ' users'
                  }
                </p>
              </td>
              <td class=price>
                ${escape(formatPrice(project.price))}
              </td>
            </tr>
          `
        })}
        </tbody>
        <tfoot class=total>
          <tr>
            <td>Total:</td>
            <td class=price>${escape(formatPrice(order.total))}</td>
          </tr>
        </tfoot>
      </table>
    </section>
    <form class=pay method=post action=/pay/${order.orderID}>
      <section id=payment>
        <h2>Credit Card Payment</h2>
        <div id=card></div>
        <div id=card-errors></div>
        ${errorsFor('token')}
      </section>
      <section id=email>
        <label>
          Your E-Mail Address:
          <input name=email type=email value="${postValue('name')}">
        </label>
        ${errorsFor('email')}
      </section>
      <section id=terms>
        <label>
          <input type=checkbox name=terms value=accepted required>
          Check this box to accept License Zero&rsquo;s
          <a href=/terms/service target=_blank>terms of service</a>.
        </label>
        ${errorsFor('terms')}
      </section>
      <input id=submitButton type=submit value="Buy Licenses">
    </form>
    <script src=https://js.stripe.com/v3/></script>
    <script src=/pay.js></script>
  </main>
  ${footer()}
</body>
</html>
  `)

  function errorsFor (name) {
    if (!postData) return undefined
    if (!Array.isArray(postData.errors)) return undefined
    var errors = postData.errors.filter(function (error) {
      return error.name === name
    })
    return html`
      ${errors.map(function (error) {
        return html`<p class=error>${escape(error.message)}</p>`
      })}
    `
  }

  function postValue (name) {
    if (!postData) return undefined
    if (!postData[name]) return undefined
    return escape(postData[name])
  }
}

var postSchema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email'
    },
    terms: {
      const: 'accepted'
    },
    token: {
      type: 'string',
      pattern: '^tok_'
    }
  },
  required: ['email', 'terms', 'token'],
  additionalProperties: false
}

var ajv = new AJV({allErrors: true})
var validatePost = ajv.compile(postSchema)

function post (request, response, service, order) {
  var data = {}
  var parser = new Busboy({headers: request.headers})
  parser.on('field', function (name, value) {
    if (Object.keys(postSchema.properties).includes(name)) {
      data[name] = value
    }
  })
  parser.once('finish', function () {
    if (!validatePost(data)) {
      data.errors = validatePost.errors.map(function (error) {
        var dataPath = error.dataPath
        if (dataPath === '.email') {
          return {
            name: 'email',
            message: 'You must provide a valid e-mail address.'
          }
        } else if (dataPath === '.terms') {
          return {
            name: 'terms',
            message: 'You must accept the terms to continue.'
          }
        } else if (dataPath === '.token') {
          return {
            name: 'token',
            message: 'You must provide payment to continue.'
          }
        } else {
          service.log.info(error, 'unexpected schema error')
          return null
        }
      })
      return get(request, response, service, order, data)
    }
    var projects = order.projects
    var stripeMetadata = {
      orderID: order.orderID,
      jurisdiction: order.jurisdiction,
      licensee: order.licensee
    }
    var stripeCustomerID
    var licenses = []
    var purchaseID = uuid()
    // TODO: batch payments by licensor
    runSeries([
      // See https://stripe.com/docs/connect/shared-customers.
      //
      // 1.  Create a Customer object on License Zero's own Stripe
      //     account, using the token from Stripe.js.
      //
      // 2.  For each project transaction, generate a payment token
      //     from the Customer.
      //
      // 3.  Use those tokens to create Charge objects on Licensors'
      //     Connect-ed Stripe accounts.
      //
      // 4.  Capture the charges once the licenses go out by e-mail.
      //
      // 5.  Delete the Customer object, to prevent any further Charges,
      //     Subscriptions, &c.  Stripe will retain records of the
      //     Charges made with generated tokens.
      //
      // Stripe Step 1:
      function createSharedCustomer (done) {
        service.stripe.api.customers.create({
          metadata: stripeMetadata,
          source: data.token
        }, function (error, customer) {
          if (error) return done(error)
          stripeCustomerID = customer.id
          done()
        })
      },
      runParallel.bind(null,
        [
          recordAcceptance.bind(null, service, {
            licensee: order.licensee,
            jurisdiction: order.jurisdiction,
            email: order.email,
            date: new Date().toISOString()
          })
        ].concat(projects.map(function (project) {
          var commission = applicationFee(project)
          var chargeID
          return function (done) {
            runSeries([
              runWaterfall.bind(null, [
                // Stripe Step 2:
                function createSharedCustomerToken (done) {
                  service.stripe.api.tokens.create({
                    customer: stripeCustomerID
                  }, {
                    stripe_account: project.licensor.stripe.id
                  }, done)
                },
                // Stripe Step 3:
                function chargeSharedCustomer (token, done) {
                  service.stripe.api.charges.create({
                    amount: project.price,
                    currency: 'usd',
                    source: token.id,
                    application_fee: commission,
                    statement_descriptor: 'License Zero License',
                    metadata: stripeMetadata,
                    // Do not capture yet.
                    // Wait until the e-mail goes through.
                    capture: false
                  }, {
                    stripe_account: project.licensor.stripe.id
                  }, function (error, charge) {
                    if (error) return done(error)
                    service.log.info(charge, 'charge')
                    chargeID = charge.id
                    done()
                  })
                }
              ]),
              function (done) {
                runWaterfall([
                  function emaiLicense (done) {
                    var parameters = {
                      FORM: 'private license',
                      VERSION: privateLicense.version,
                      date: new Date().toISOString(),
                      tier: order.tier,
                      project: pick(project, [
                        'projectID', 'repository', 'description'
                      ]),
                      licensee: {
                        name: order.licensee,
                        jurisdiction: order.jurisdiction
                      },
                      licensor: pick(project.licensor, [
                        'name', 'jurisdiction'
                      ]),
                      price: project.price
                    }
                    var manifest = stringify(parameters)
                    privateLicense(parameters, function (error, document) {
                      if (error) return done(error)
                      var license = {
                        projectID: project.projectID,
                        manifest: manifest,
                        document: document,
                        publicKey: project.licensor.publicKey,
                        signature: ed25519.sign(
                          manifest + '\n\n' + document,
                          project.licensor.publicKey,
                          project.licensor.privateKey
                        )
                      }
                      licenses.push(license)
                      service.email({
                        to: data.email,
                        subject: 'License Zero Receipt and License File',
                        text: []
                          .concat([
                            'Thank you for buying a license through ' +
                            'licensezero.com.',
                            'Order ID: ' + order.orderID,
                            'Total: ' + priceColumn(project.price),
                            'Attached is a License Zero license file for:'
                          ])
                          .concat([
                            'Licensee:     ' + order.licensee,
                            'Jurisdiction: ' + order.jurisdiction,
                            'Project:      ' + project.projectID,
                            'Description:  ' + project.description,
                            'Repository:   ' + project.repository,
                            'License Tier: ' + capitalize(order.tier)
                          ].join('\n')),
                        license: license
                      }, function (error) {
                        if (error) return done(error)
                        done(null, license)
                      })
                    })
                  },
                  function (license, done) {
                    recordSignature(
                      service, license.publicKey, license.signature,
                      function (error) {
                        if (error) return done(error)
                        done(null, license)
                      }
                    )
                  },
                  function emailLicensorStatement (license, done) {
                    service.email({
                      to: project.licensor.email,
                      subject: 'License Zero Statement',
                      text: [
                        [
                          'License Zero sold a license',
                          'on your behalf.'
                        ].join('\n'),
                        [
                          'Order:        ' + order.orderID,
                          'Project:      ' + project.projectID,
                          'Description:  ' + project.description,
                          'Repository:   ' + project.repository,
                          'Tier:         ' + capitalize(order.tier)
                        ].join('\n'),
                        [
                          'Price:      ' + priceColumn(project.price),
                          'Commission: ' + priceColumn(commission),
                          'Total:      ' + priceColumn(project.price - commission)
                        ].join('\n'),
                        [
                          'The Ed25519 cryptographic signature to the',
                          'license is:'
                        ].join('\n'),
                        [
                          license.signature.slice(0, 32),
                          license.signature.slice(32, 64),
                          license.signature.slice(64, 96),
                          license.signature.slice(96)
                        ].join('\n')
                      ]
                    }, done)
                  }
                ], done)
              },
              function captureCharge (done) {
                // Stripe Step 4:
                service.stripe.api.charges.capture(
                  chargeID,
                  {stripe_account: project.licensor.stripe.id},
                  done
                )
              }
            ], done)
          }
        }))
      ),
      function (done) {
        runParallel([
          function deleteOrderFile (done) {
            var file = orderPath(service, order.orderID)
            fs.unlink(file, done)
          },
          // Stripe Step 5:
          function deleteCustomer (done) {
            service.stripe.api.customers.del(
              stripeCustomerID, done
            )
          },
          // Write a JSON file containing all license data,
          // from all transactions, to a capability URL
          // generated for the purchase. The licensee can
          // use this URL to load all the new licenses into
          // CLI at once, without pulling them out of
          // e-mail.
          function writePurchase (done) {
            var file = purchasePath(service, purchaseID)
            runSeries([
              mkdirp.bind(null, path.dirname(file)),
              fs.writeFile.bind(null, file, JSON.stringify({
                date: new Date().toISOString(),
                licenses: licenses
              }))
            ], done)
          }
        ], done)
      }
    ], function (error) {
      if (error) {
        service.log.error(error)
        response.statusCode = 500
        response.setHeader('Content-Type', 'text/html')
        response.end(html`
<!doctype html>
<html lang=en>
${head('Technical Error')}
<body>
  ${nav()}
  ${header('Technical Error')}
  <main>
    <p>
      One or more of your license purchases
      failed to go through, due to a technical error.
    </p>
    <p>
      Please check your e-mail for any purchases
      that may have completed successfully.
    </p>
  </main>
  ${footer()}
</body>
</html>
        `)
      } else {
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html')
        var purchaseURL = (
          'https://licensezero.com/purchases/' + purchaseID
        )
        response.end(html`
<!doctype html>
<html lang=en>
${head('Thank you')}
<body>
  ${nav()}
  ${header()}
  <main>
    <h1 class=thanks>Thank You</h1>
    <p>
      Your purchase was successful.
      You will receive receipts and license files by e-mail shortly.
    </p>
    <p>
      To load all of your new licenses into the License
      Zero command line interface, run the following
      command anytime in the next twenty four hours:
    </p>
    <pre><code class=install>l0-purchased ${purchaseURL}</code></pre>
  </main>
  ${footer()}
</body>
</html>
        `)
      }
    })
  })
  request.pipe(parser)
}

function expired (created) {
  return (new Date() - new Date(created)) > ONE_DAY
}

function notFound (response) {
  response.statusCode = 404
  response.setHeader('Content-Type', 'text/html')
  response.end(html`
<!doctype html>
<html lang=en>
${head('Invalid or Expired')}
<body>
  ${nav()}
  ${header()}
  <main>
    <h1>Invalid or Expired Purchase</h2>
    <p>
      There is no active purchase at the link you reached.
    </p>
  </main>
</body>
</html>
  `)
}

function priceColumn (amount) {
  return padStart(formatPrice(amount), 10, ' ')
}
