var VERSION = '1.0.0'

module.exports = function (options) {
  return `
Licenze Zero Public License ${VERSION}

Copyright ${options.name}
          ${options.jurisdiction} (ISO 3166-2)

          Ed25519: ${options.publicKey.slice(0, 32)}
                   ${options.publicKey.slice(32)}

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:

1.  Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.

2.  Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer
    in the documentation and/or other materials provided with the
    distribution.

3.  Use in any manner primarily intended for or directed toward
    commercial advantage or private monetary compensation, and not
    development of feedback or modifications to be submitted to the
    licensor for distribution under public license, must be limited to
    ${options.grace} calendar days.

    This condition is waived if licenses on other terms cease to
    be available via the following agent, or a successor named in a
    subsequent release, for 90 consecutive calendar days:

        Artless Devices LLC
        https://licensezero.com
        Product: ${options.productID}
        Licensor: ${options.licensorID}

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  `.trim() + '\n'
}

module.exports.version = VERSION
