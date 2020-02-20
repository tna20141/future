const assert = require('assert');

function assertWithEmptyContext(actual, expected) {
  const newExpected = Object.assign({ context: undefined }, expected);
  const newActual = Object.assign({ context: undefined }, actual);
  return assert.deepEqual(newActual, newExpected);
}

exports.assertWithEmptyContext = assertWithEmptyContext;
