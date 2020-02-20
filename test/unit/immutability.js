const assert = require('assert');

const Future = require('../../index');
const utils = require('./utils');

const assertWithEmptyContext = utils.assertWithEmptyContext;

describe(':: immutability', () => {
  it('immutability when thenning', done => {
    const original1 = Future.resolve(0).then(num => num + 1);
    const original2 = Future.resolve(1).then(num => num + 1);
    original1.fork(result => {
      assertWithEmptyContext(result, { value: 1 });
    });
    original1.then(num => num + 2).fork(result => {
      assertWithEmptyContext(result, { value: 3 });
    });
    // fork the original again
    original1.fork(result => {
      assertWithEmptyContext(result, { value: 1 });
    });
    original1.then(num => Future.resolve(num - 1)).fork(result => {
      assertWithEmptyContext(result, { value: 0 });
    });
    const new2 = original2.then(num => num + 3);
    new2.then(num => num + 4).fork(result => {
      assertWithEmptyContext(result, { value: 9 });
    });
    original2.fork(result => {
      assertWithEmptyContext(result, { value: 2 });
    });
    new2.fork(result => {
      assertWithEmptyContext(result, { value: 5 });
    });
    setTimeout(done, 10);
  });

  it('immutability when catching', done => {
    const original1 = Future.resolve(0).then(num => num + 1);
    const original2 = Future.reject(1);
    original1.fork(result => {
      assertWithEmptyContext(result, { value: 1 });
    });
    original1.catch(() => 'reject 1').fork(result => {
      assertWithEmptyContext(result, { value: 1 });
    });
    original1.then(() => Future.reject()).catch(() => 'reject 1').fork(result => {
      assertWithEmptyContext(result, { value: 'reject 1' });
    });
    original1.fork(result => {
      assertWithEmptyContext(result, { value: 1 });
    });
    original1
      .then(num => Future.reject(num - 1))
      .catch(num => Future.reject(num))
      .fork(result => {
        assert.fail('shouldn\'t get into the resolve branch');
      }, error => {
        assertWithEmptyContext(error, { error: 0 });
      });
    original1.fork(result => {
      assertWithEmptyContext(result, { value: 1 });
    });

    const new2 = original2.catch(error => {
      throw error + 3;
    });
    new2.then(num => num + 4).catch(error => Future.reject(error + 1)).fork(() => {
      assert.fail('shouldn\'t get into the resolve branch');
    }, error => {
      assertWithEmptyContext(error, { error: 5 });
    });
    original2.fork(() => {
      assert.fail('shouldn\'t get into the resolve branch');
    }, error => {
      assertWithEmptyContext(error, { error: 1 });
    });
    new2.fork(() => {
      assert.fail('shouldn\'t get into the resolve branch');
    }, error => {
      assertWithEmptyContext(error, { error: 4 });
    });
    setTimeout(done, 10);
  });
});
