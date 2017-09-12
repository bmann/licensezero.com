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
      to the public on the terms of a
      <a href=/licenses/public>standard public license</a>.
    </p>
    <p>
      Private licenses sold through License Zero use
      <a href=/licenses/private>standard private licenses</a>
      in a few variations.
    </p>
    <p>
      Licensor may waive the non-commercial
      condition of the public license with a
      <a href=/licenses/waiver>standard waiver</a>.
    </p>
  </main>
  ${footer()}
</body>
</html>
  `)
}