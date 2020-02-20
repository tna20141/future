const assert = require('assert');

const Future = require('../../index');
const utils = require('./utils');

const assertWithEmptyContext = utils.assertWithEmptyContext;

describe(':: then', () => {
  it('chaining futures without errors', done => {
    const future = Future.resolve(2)
      .then(num => Future.resolve(num + 3))
      .then(num => num + 4)
      .then(num => Future.resolve(num + 5));
    future.fork(result => {
      assertWithEmptyContext(result, { value: 14 });
      done();
    }, () => {
      assert.fail('shouldn\'t get into the reject branch');
    });
  });

  it('nesting futures', done => {
    const numTransformation = num => Future.resolve(num + 2)
      .then(num => num + 3)
      .then(num => num - 1);

    Future.resolve('aa')
      .then(str => str + str)
      .then(str => Future.resolve(str + 'a')
        .then(str => str.length)
        .then(numTransformation)
      )
      .then(num => num.toString())
      .fork(result => {
        assertWithEmptyContext(result, { value: 9 });
        done();
      });
  });

  it('invalid input', done => {
    assert.throws(() => {
      Future.resolve(2).then('aa');
    }, {
      name: 'TypeError',
      message: 'then() expects a function as parameter',
    });

    assert.throws(() => {
      Future.reject(2).then('aa');
    }, {
      name: 'TypeError',
      message: 'then() expects a function as parameter',
    });
    done();
  });
});
