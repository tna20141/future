const assert = require('assert');

const Future = require('../../index');
const utils = require('./utils');

const assertWithEmptyContext = utils.assertWithEmptyContext;
const timeoutOffset = 10;
const timeoutOffsetLeft = 5;

describe(':: after', () => {
  it('resolve value after some time', done => {
    const timeout = 500;
    const future = Future.after(timeout, { a: { b: 1 } });
    const begin = Date.now();
    future.fork(result => {
      const end = Date.now();
      const diff = end - begin;
      assertWithEmptyContext(result, { value: { a: { b: 1 } } });
      assert.ok(diff > timeout - timeoutOffsetLeft && diff < timeout + timeoutOffset,
        `expected: ${timeout}, actual: ${diff}`);
      done();
    }, () => {
      assert.fail('shouldn\'t get into the reject branch');
    });
  });

  it('resolve nothing after some time', done => {
    const timeout = 500;
    const future = Future.after(timeout);
    const begin = Date.now();
    future.fork(result => {
      const end = Date.now();
      const diff = end - begin;
      assertWithEmptyContext(result, { value: undefined });
      assert.ok(diff > timeout - timeoutOffsetLeft && diff < timeout + timeoutOffset,
        `expected: ${timeout}, actual: ${diff}`);
      done();
    }, () => {
      assert.fail('shouldn\'t get into the reject branch');
    });
  });
});

describe(':: rejectAfter', () => {
  it('reject value after some time', done => {
    const timeout = 500;
    const future = Future.rejectAfter(timeout, { a: { b: 1 } });
    const begin = Date.now();
    future.fork(() => {
      assert.fail('shouldn\'t get into the resolve branch');
    }, error => {
      const end = Date.now();
      const diff = end - begin;
      assertWithEmptyContext(error, { error: { a: { b: 1 } } });
      assert.ok(diff > timeout - timeoutOffsetLeft && diff < timeout + timeoutOffset,
        `expected: ${timeout}, actual: ${diff}`);
      done();
    });
  });

  it('reject nothing after some time', done => {
    const timeout = 500;
    const future = Future.rejectAfter(timeout);
    const begin = Date.now();
    future.fork(() => {
      assert.fail('shouldn\'t get into the resolve branch');
    }, error => {
      const end = Date.now();
      const diff = end - begin;
      assertWithEmptyContext(error, { error: undefined });
      assert.ok(diff > timeout - timeoutOffsetLeft && diff < timeout + timeoutOffset,
        `expected: ${timeout}, actual: ${diff}`);
      done();
    });
  });
});
