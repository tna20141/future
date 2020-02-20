const assert = require('assert');

const Future = require('../../index');
const utils = require('./utils');

const assertWithEmptyContext = utils.assertWithEmptyContext;

describe(':: reject', () => {
  it('reject value', done => {
    const future = Future.reject({ a: { b: 1 } });
    future.fork(() => {
      assert.fail('shouldn\'t get into the resolve branch');
    }, error => {
      assertWithEmptyContext(error, { error: { a: { b: 1 } } });
      done();
    });
  });
  it('reject null', done => {
    const future = Future.reject(null);
    future.fork(() => {
      assert.fail('shouldn\'t get into the reject branch');
    }, error => {
      assertWithEmptyContext(error, { error: null });
      done();
    });
  });
  it('reject undefined', done => {
    const future = Future.reject(undefined);
    future.fork(() => {
      assert.fail('shouldn\'t get into the resolve branch');
    }, error => {
      assertWithEmptyContext(error, { error: undefined });
      done();
    });
  });
  it('reject nothing', done => {
    const future = Future.reject();
    future.fork(() => {
      assert.fail('shouldn\'t get into the resolve branch');
    }, error => {
      assertWithEmptyContext(error, { error: undefined });
      done();
    });
  });
});
