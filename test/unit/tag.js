const assert = require('assert');

const Future = require('../../index');
const utils = require('./utils');

const assertWithEmptyContext = utils.assertWithEmptyContext;

describe(':: tag', () => {
  it('tagging with then chain', done => {
    const future = Future.resolve(2)
      .then(num => num + 1)
      .tag('tag1', { name: 'tag1' })
      .then(num => Future.resolve(num + 3))
      .then(num => num - 2)
      .tag('tag1', 33)
      .tag('tag2', { a: { b: 1 } })
      .then(num => num.toString());
    future
      .then(str => str + 'a')
      .tag('tag 3')
      .fork(result => {
        assert.deepEqual(result, {
          value: '4a',
          context: {
            tags: [
              { name: 'tag1', data: { name: 'tag1' } },
              { name: 'tag1', data: 33 },
              { name: 'tag2', data: { a: { b: 1 } } },
              { name: 'tag 3', data: undefined },
            ],
          },
        });
        done();
      }, () => {
        assert.fail('shouldn\'t get into the reject branch');
      });
  });

  it('merging contexts in then chain, and immutability', done => {
    const future1 = Future.resolve(2)
      .tag('tag1', {})
      .tag('tag2', { a: 1 });

    Future.resolve(3)
      .tag('tag3', { b: 2 })
      .then(num => num + 3)
      .tag('tag4', { b: 3 })
      .then(() => future1)
      .tag('tag5', 'zz')
      .then(val => val)
      .fork(result => {
        assert.deepEqual(result, {
          value: 2,
          context: {
            tags: [
              { name: 'tag3', data: { b: 2 } },
              { name: 'tag4', data: { b: 3 } },
              { name: 'tag1', data: {} },
              { name: 'tag2', data: { a: 1 } },
              { name: 'tag5', data: 'zz' },
            ],
          },
        });

        future1.fork(result2 => {
          assert.deepEqual(result2, {
            value: 2,
            context: {
              tags: [
                { name: 'tag1', data: {} },
                { name: 'tag2', data: { a: 1 } },
              ],
            },
          });
          done();
        });
      }, () => {
        assert.fail('shouldn\'t get into the reject branch');
      });
  });

  it('skipping unreachable tags', done => {
    let catch1Entered = false;
    const future = Future.resolve(2)
      .tag('tag1', { a: 1 })
      .then(() => Future.reject('zz'))
      .tag('tag2')
      .then(str => str + 'a')
      .tag('tag3')
      .tag('tag4');

    future
      .then(str => str + 'b')
      .tag('tag5')
      .catch(error => {
        catch1Entered = true;
      })
      .tag('tag6', 'xx')
      .then(() => Future.resolve(2))
      .catch(() => {
        assert.fail('shouldn\'t get into the reject branch');
      })
      .tag('tag7')
      .fork(result => {
        assert.ok(catch1Entered);
        assert.deepEqual(result, {
          value: 2,
          context: { tags: [
            { name: 'tag1', data: { a: 1 } },
            { name: 'tag6', data: 'xx' },
            { name: 'tag7', data: undefined },
          ] },
        });

        future
          .fork(() => {
            assert.fail('shouldn\'t get into the resolve branch');
          }, error => {
            assert.deepEqual(error, {
              error: 'zz',
              context: { tags: [{ name: 'tag1', data: { a: 1 } }] },
            });
            done();
          })
      }, () => {
        assert.fail('shouldn\'t get into the reject branch');
      });
  });

  it('merging contexts with catch clauses', done => {
    const future = Future.resolve(3)
      .tag('tag1')
      .then(() => Future.reject())
      .tag('tag2')
      .catch(() => {
        throw 'aa';
      })
      .tag('tag3')
      .then(() => 3)
      .tag('tag4')
      .catch(() => 1)
      .tag('tag5')
      .then(() => Future.reject(5));

    Future.resolve(10)
      .tag('taga', { a: 1 })
      .tag('tagb', { b: 2 })
      .then(() => future)
      .fork(() => {
        assert.fail('shouldn\'t get into the resolve branch');
      }, error => {
        assert.deepEqual(error, {
          error: 5,
          context: { tags: [
            { name: 'taga', data: { a: 1 } },
            { name: 'tagb', data: { b: 2 } },
            { name: 'tag1', data: undefined },
            { name: 'tag5', data: undefined },
          ] },
        });

        Future.resolve(5)
          .tag('tagc')
          .tag('tagd')
          .then(() => Future.reject(6))
          .tag('tage')
          .catch(() => future)
          .fork(() => {
            assert.fail('shouldn\'t get into the resolve branch');
          }, error => {
            assert.deepEqual(error, {
              error: 5,
              context: { tags: [
                { name: 'tagc', data: undefined },
                { name: 'tagd', data: undefined },
                { name: 'tag1', data: undefined },
                { name: 'tag5', data: undefined },
              ] },
            });
            done();
          });
      });
  });

  it('merging context of a rejected future with a fulfilled one', done => {
    const future = Future.resolve(3)
      .tag('tag1')
      .tag('tag2');

    Future.resolve()
      .tag('taga')
      .tag('tagb')
      .then(() => Future.reject())
      .catch(() => future)
      .fork(result => {
        assert.deepEqual(result, {
          value: 3,
          context: { tags: [
            { name: 'taga', data: undefined },
            { name: 'tagb', data: undefined },
            { name: 'tag1', data: undefined },
            { name: 'tag2', data: undefined },
          ] },
        });
        done();
      });
  });

  it('initial tagging', done => {
    const future = Future.tag('aa', 'bb')
      .fork(result => {
        assert.deepEqual(result, { value: undefined, context: { tags: [
          { name: 'aa', data: 'bb' },
        ] } });
        Future.tag('bb')
          .then(() => Future.resolve('cc'))
          .tag('dd')
          .fork(result2 => {
            assert.deepEqual(result2, { value: 'cc', context: { tags: [
              { name: 'bb', data: undefined },
              { name: 'dd', data: undefined },
            ] } });
            done();
          }, () => {
            assert.fail('shouldn\'t get into the reject branch');
          });
      }, () => {
        assert.fail('shouldn\'t get into the reject branch');
      });
  });
});
