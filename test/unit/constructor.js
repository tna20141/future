const assert = require('assert');

const Future = require('../../index');
const utils = require('./utils');

const assertWithEmptyContext = utils.assertWithEmptyContext;

describe(':: new Future', () => {
  it('new future resolves', done => {
    const future = new Future(resolve => {
      setTimeout(() => resolve(2), 10);
    });

    future
      .then(num => num + 3)
      .catch(() => {
        assert.fail('shouldn\'t get into the reject branch');
      })
      .fork(result => {
        assertWithEmptyContext(result, { value: 5 });
        done();
      }, () => {
        assert.fail('shouldn\'t get into the reject branch');
      });
  });

  it('new future rejects', done => {
    const future = new Future((resolve, reject) => {
      setTimeout(() => reject(2), 10);
    });

    future
      .then(() => {
        assert.fail('shouldn\'t get into the resolve branch');
      })
      .fork(() => {
        assert.fail('shouldn\'t get into the resolve branch');
      }, error => {
        assertWithEmptyContext(error, { error: 2 });
        future
          .catch(num => num + 4)
          .fork(result => {
            assertWithEmptyContext(result, { value: 6 });
            done();
          }, () => {
            assert.fail('shouldn\'t get into the reject branch');
          });
      });
  });

  it('new future function throws exception', done => {
    const future = new Future(() => {
      throw 'aa';
    });

    future
      .then(() => {
        assert.fail('shouldn\'t get into the resolve branch');
      })
      .fork(() => {
        assert.fail('shouldn\'t get into the resolve branch');
      }, error => {
        assertWithEmptyContext(error, { error: 'aa' });
        future
          .catch(str => str + 'a')
          .fork(result => {
            assertWithEmptyContext(result, { value: 'aaa' });
            done();
          }, () => {
            assert.fail('shouldn\'t get into the reject branch');
          });
      });
  });

  it('invalid input', done => {
    assert.throws(() => {
      new Future('aa');
    }, {
      name: 'TypeError',
      message: 'constructor expects a function as parameter',
    });
    done();
  });
});
