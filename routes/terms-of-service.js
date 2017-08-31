var commonformToHTML = require('commonform-html')
var terms = require('../forms/terms')

// TODO: terms of service

module.exports = function (request, response, service) {
  terms(function (error, terms) {
    if (error) {
      service.log.error(error)
      response.statusCode = 500
      return response.end()
    }
    response.setHeader('Content-Type', 'text/html')
    response.end(`
<!doctype html>
<html lang=en>
<head>
  <meta charset=UTF-8>
  <title>License Zero | Terms</title>
  <link rel=stylesheet href=/normalize.css>
  <link rel=stylesheet href=/styles.css>
</head>
<body>
  <header><h1>License Zero | Terms</h1></header>
  <main>
      <article class=commonform>
        ${
          commonformToHTML(
            terms.commonform,
            terms.directions,
            {
              title: 'License Zero Terms of Use',
              html5: true,
              lists: true
            }
          )
        }
      </article>
  </main>
</body>
</html>
    `.trim())
  })
}