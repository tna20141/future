const assert = require('assert');

const Future = require('../../index');
const utils = require('./utils');

const assertWithEmptyContext = utils.assertWithEmptyContext;

describe(':: toPromise', () => {
  it('resolve', done => {
    const future = Future.resolve(2)
      .then(num => num + 1)
      .tag('tag1', { name: 'tag1' })
      .then(num => Future.resolve(num + 3))
      .then(num => num - 2)
      .tag('tag1', 33)
      .toPromise()
      .then(result => {
        assert.deepEqual(result, {
          value: 4,
          context: { tags: [
            { name: 'tag1', data: { name: 'tag1' } },
            { name: 'tag1', data: 33 },
          ] },
        });

        Future.resolve().toPromise()
          .catch(() => {
            assert.fail('shouldn\'t get into the reject branch');
          })
          .then(result => {
            assert.deepEqual(result, { value: undefined });
            done();
          });
      }, () => {
        assert.fail('shouldn\'t get into the reject branch');
      });
  });

  it('reject', done => {
    const future = Future.reject({ a: { b: 1 } });
    future.toPromise().then(() => {
      assert.fail('shouldn\'t get into the resolve branch');
    }, error => {
      assertWithEmptyContext(error, { error: { a: { b: 1 } } });
      Future
        .resolve(1)
        .tag('aa')
        .tag('bb')
        .then(() => Future.reject())
        .toPromise()
        .then(() => {
          assert.fail('shouldn\'t get into the resolve branch');
        })
        .catch(error => {
          assert.deepEqual(error, {
            error: undefined,
            context: { tags: [
              { name: 'aa', data: undefined },
              { name: 'bb', data: undefined },
            ] },
          });
          done();
        });
    });
  });
})
