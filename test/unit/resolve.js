const assert = require('assert');

const Future = require('../../index');
const utils = require('./utils');

const assertWithEmptyContext = utils.assertWithEmptyContext;

describe(':: resolve', () => {
  it('resolve value', done => {
    const future = Future.resolve({ a: { b: 1 } });
    future.fork(result => {
      assertWithEmptyContext(result, { value: { a: { b: 1 } } });
      done();
    }, () => {
      assert.fail('shouldn\'t get into the reject branch');
    });
  });
  it('resolve null', done => {
    const future = Future.resolve(null);
    future.fork(result => {
      assertWithEmptyContext(result, { value: null });
      done();
    }, () => {
      assert.fail('shouldn\'t get into the reject branch');
    });
  });
  it('resolve undefined', done => {
    const future = Future.resolve(undefined);
    future.fork(result => {
      assertWithEmptyContext(result, { value: undefined });
      done();
    }, () => {
      assert.fail('shouldn\'t get into the reject branch');
    });
  });
  it('resolve nothing', done => {
    const future = Future.resolve();
    future.fork(result => {
      assertWithEmptyContext(result, { value: undefined });
      done();
    }, () => {
      assert.fail('shouldn\'t get into the reject branch');
    });
  });
});
