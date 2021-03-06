var projectProperties = {
  projectID: require('./project-id'),
  homepage: require('./homepage'),
  description: require('./description')
}

var properties = {
  FORM: { const: 'private license' },
  VERSION: {
    enum: [
      '1.0.0',
      '1.1.0',
      '1.2.0'
    ]
  },
  orderID: require('./order-id'),
  date: {
    type: 'string',
    format: 'date-time'
  },
  project: {
    type: 'object',
    properties: projectProperties,
    required: Object.keys(projectProperties),
    additionalProperties: false
  },
  licensee: {
    name: require('./name'),
    jurisdiction: require('./jurisdiction')
  },
  licensor: {
    name: require('./name'),
    jurisdiction: require('./jurisdiction')
  },
  price: require('./price')
}

module.exports = {
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false
}
