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
      License Zero projects are licensed
      to the public on the terms of either
      <a href=/licenses/noncommercial>a standard noncommercial public license</a>
      or
      <a href=/licenses/reciprocal>a standard reciprocal public license</a>.
    </p>
    <p>
      Private licenses sold through License Zero use
      <a href=/licenses/private>standard private licenses</a>
      in a few variations.
    </p>
    <p>
      Licensors may waive the non-commercial and reciprocal
      conditions of the public licenses with a
      <a href=/licenses/waiver>standard waiver</a>.
    </p>
    <p>
      Licensors may offer to relicense their projects
      on the terms of the
      <a href=/licenses/permissive>License Zero Permissive Public License</a>
      under a
      <a href=/licenses/relicense>standard relicense agreement</a>.
    </p>
    <p>
      Licensors may sell waivers and relicensing agreements
      directly to clients, through purchase orders, using
      <a href=/licenses/quotes/waiver.odt>a form waiver quote</a>
      and
      <a href=/licenses/quotes/relicense.odt>a form relicense quote</a>.
    </p>
  </main>
  ${footer()}
</body>
</html>
  `)
}
