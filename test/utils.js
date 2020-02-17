const assert = require('assert');
const r = require('ramda');

function assertWithEmptyContext(actual, expected) {
  return assert.deepEqual(actual, r.merge({ context: {} }, expected));
}

exports.assertWithEmptyContext = assertWithEmptyContext;
