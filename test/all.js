const assert = require('assert');
const r = require('ramda');

const Future = require('../index');
const utils = require('./utils');

const assertWithEmptyContext = utils.assertWithEmptyContext;

describe(':: all', () => {
  it('empty list', done => {
    Future.all([])
      .fork(result => {
        assertWithEmptyContext(result, { value: [] });
      }, () => {
        assert.fail('shouldn\'t get into the reject branch');
      });

    Future.all([], { limit: 1, saveAllContexts: true })
      .then(arr => arr.concat(2))
      .fork(result => {
        assertWithEmptyContext(result, { value: [2] });
      }, () => {
        assert.fail('shouldn\'t get into the reject branch');
      });

    Future.all([], { ignoreError: true })
      .catch(() => {
        assert.fail('shouldn\'t get into the reject branch');
      })
      .fork();

    setTimeout(done, 10);
  });

  it('one element', done => {
    Future.all([Future.resolve(1)], { limit: Infinity })
      .then(arr => arr.concat(2))
      .fork(result => {
        assertWithEmptyContext(result, { value: [1, 2] });
      }, () => {
        assert.fail('shouldn\'t get into the reject branch');
      });

    Future.all([Future.resolve().tag('aa', 'bb')], { limit: 3 })
      .fork(result => {
        assert.deepEqual(result, {
          value: [undefined],
          context: { tags: [{ name: 'aa', data: 'bb' }] },
        });
      }, () => {
        assert.fail('shouldn\'t get into the reject branch');
      });

    setTimeout(done, 10);
  });

  it('multiple elements', done => {
    const futures = [
      Future.resolve(1).tag('zz').tag('z1'),
      Future.resolve(2),
      Future.resolve(3).tag('zzz', 'z').tag('z2'),
    ];

    Future.all(futures, { limit: 2, saveAllContexts: true })
      .then(arr => arr.concat('more'))
      .fork(result => {
        assert.deepEqual(result, {
          value: [1, 2, 3, 'more'],
          context: { tags: [
            { name: 'zz', data: undefined },
            { name: 'z1', data: undefined },
            { name: 'zzz', data: 'z' },
            { name: 'z2', data: undefined },
          ] },
        });
      });

    Future.all(futures)
      .catch(() => {
        assert.fail('shouldn\'t get into the reject branch');
      })
      .fork(result => {
        assert.deepEqual(result, {
          value: [1, 2, 3],
          context: { tags: [
            { name: 'zz', data: undefined },
            { name: 'z1', data: undefined },
          ] },
        });
      });

    setTimeout(done, 10);
  });

  it('rejections', done => {
    const futures = [
      Future.resolve(1).tag('zz', 'z1'),
      Future.resolve(2).tag('z2').then(() => Future.reject(3)).tag('z4'),
      Future.resolve(4).tag('zzz'),
    ];

    Future.all(futures, { limit: 1, saveAllContexts: true })
      .then(() => {
        assert.fail('shouldn\'t get into the resolve branch');
      })
      .fork(() => {
        assert.fail('shouldn\'t get into the resolve branch');
      }, error => {
        assert.deepEqual(error, {
          error: 3,
          context: { tags: [
            { name: 'z2', data: undefined },
          ] },
        });
      });

    Future.all(futures)
      .catch(error => error + 3)
      .fork(result => {
        assert.deepEqual(result, {
          value: 6,
          context: { tags: [
            { name: 'z2', data: undefined },
          ] },
        });
      }, () => {
        assert.fail('shouldn\'t get into the reject branch');
      });

    Future.all(futures, { ignoreError: true, saveAllContexts: true })
      .fork(result => {
        assert.deepEqual(result, {
          value: [1, 3, 4],
          context: { tags: [
            { name: 'zz', data: 'z1' },
            { name: 'z2', data: undefined },
            { name: 'zzz', data: undefined },
          ] },
        });
      }, () => {
        assert.fail('shouldn\'t get into the reject branch');
      });

    Future.all(futures, { ignoreError: true })
      .fork(result => {
        assert.deepEqual(result, {
          value: [1, 3, 4],
          context: { tags: [
            { name: 'zz', data: 'z1' },
          ] },
        });
      }, () => {
        assert.fail('shouldn\'t get into the reject branch');
      });

    Future.all([Future.reject(3)])
      .fork(() => {
        assert.fail('shouldn\'t get into the resolve branch');
      }, error => {
        assertWithEmptyContext(error, { error: 3 });
      });

    setTimeout(done, 10);
  });
});
