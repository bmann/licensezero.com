var TIERS = require('../data/private-license-tiers')
var footer = require('./partials/footer')
var head = require('./partials/head')
var header = require('./partials/header')
var html = require('./html')
var nav = require('./partials/nav')

module.exports = function (request, response, service) {
  response.setHeader('Content-Type', 'text/html; charset=UTf-8')
  response.end(html`
<!doctype html>
<html lang=EN>
${head('Licenses')}
<body>
  ${nav()}
  ${header()}
  <main>
    <p>
      License Zero publishes and stewards a few kinds of licenses
      and license-related agreements, all of which are written to
      be as short and easy to read as possible.
    </p>
    <h2>Public Licenses</h2>
    <p>
      The kind of thing you see in <code>LICENSE</code> files.
      Public licenses give everyone permission to use your software,
      as long as they follow specific conditions.
      License Zero supports two public licenses:
    </p>
    <dl>
      <dt><a href=/licenses/reciprocal>Reciprocal License</a></dt>
      <dd>
        requires others to share the software they build with your
        work back to the community, as open source
      </dd>
      <dt><a href=/licenses/noncommercial>Noncommercial License</a></dt>
      <dd>
        limits commercial use of your software to a 30-day
        trial period
      </dd>
    </dl>
    <h2>Private Licenses</h2>
    <p>
      Users who can&rsquo;t meet the conditions of your public
      license can buy a private license through License Zero.
      These are proprietary softare licenses,
      based on <a href=https://www.apache.org/licenses/LICENSE-2.0.html>The Apache License, Version 2.0</a>
      for ease of review:
    </p>
    <dl>
      <dt><a href=/licenses/private#solo>Solo License</a></dt>
      <dd>for a single user</dd>
      <dt><a href=/licenses/private#team>Team License</a></dt>
      <dd>for up to ${escape(TIERS.team)} users</dd>
      <dt><a href=/licenses/private#company>Company License</a></dt>
      <dd>for up to ${escape(TIERS.company)} Musers</dd>
      <dt><a href=/licenses/private#enterprise>Enterprise License</a></dt>
      <dd>for an unlimited number of users</dd>
    </dl>
    <h2>Waivers</h2>
    <p>
      License Zero developers can give away quick, freebie
      exceptions to the share-back or noncommercial conditions
      using a standard forms:
      Licensors may waive the non-commercial and reciprocal
      conditions of the public licenses with a
    </p>
    <dl>
      <dt><a href=/licenses/waiver>Waiver</a></dt>
      <dd>
        gives a specific person or company permission to ignore the
        conditions of your private license requiring sharing back
        or limiting commercial use
      </dd>
    </dl>
    <h2>Relicensing</h2>
    <p>
      License Zero developers can optionally offer to relicense
      their projects onto permissive open source terms for a
      one-time fee:
    </p>
    <dl>
      <dt><a href=/licenses/relicense>Relicense Agreement</a></dt>
      <dd>
        a form contract between a License Zero and a developer
        for sponsored relicensing of a project onto permissive terms
      </dd>
      <dt><a href=/licenses/permissive>Permissive License</a></dt>
      <dd>
        a short, modern, permissive open source license without
        conditions to share back or limit commercial use
      </dd>
    </dl>
    <h2>Quotes</h2>
    <p>
      Sometimes License Zero developers will find it easier to
      sell exceptions to their public license, or close a
      relicensing deal, by sending the company a quote:
    </p>
    <dl>
      <dt><a href=/licenses/quotes/waiver.odt>Waiver Quote</a></dt>
      <dd>
        quote a price for a waiver
      </dd>
      <dt><a href=/licenses/quotes/relicense.odt>Relicense Quote</a></dt>
      <dd>
        quote a price for relicensing your project on
        permissive terms
      </dd>
    </dl>
  </main>
  ${footer()}
</body>
</html>
  `)
}
