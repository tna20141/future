const assert = require('assert');

function assertWithEmptyContext(actual, expected) {
  const newContext = Object.assign({ context: {} }, expected);
  return assert.deepEqual(actual, newContext);
}

exports.assertWithEmptyContext = assertWithEmptyContext;
