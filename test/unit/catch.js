const assert = require('assert');

const Future = require('../../index');
const utils = require('./utils');

const assertWithEmptyContext = utils.assertWithEmptyContext;

describe(':: catch', () => {
  it('standard catch behavior', done => {
    let catch1Entered = false;
    let catch2Entered = false;
    let catch3Entered = false;
    let then1Entered = false;
    Future.resolve(2)
      .then(num => {
        return Future.reject('reject 1');
      })
      .then(a => {
        assert.fail('shouldn\'t get into the resolve branch after 1st rejection');
      })
      .then(() => {
        assert.fail('shouldn\'t get into the resolve branch after 1st rejection');
      })
      .catch(error => {
        catch1Entered = true;
        assert.equal(error, 'reject 1');
        return Future.resolve('continue');
      })
      .catch(() => {
        assert.fail('shouldn\'t get into the reject branch after 1st catch');
      })
      .then(value => {
        then1Entered = true;
        assert.equal(value, 'continue');
        return Future.reject('reject 2');
      })
      .catch(error => {
        catch2Entered = true;
        assert.equal(error, 'reject 2');
        return Future.reject();
      })
      .then(() => {
        assert.fail('shouldn\'t get into the resolve branch after 2nd rejection');
      })
      .catch(error => {
        catch3Entered = true;
        assert.equal(error, undefined);
        return Future.reject();
      })
      .then(() => {
        assert.fail('shouldn\'t get into the resolve branch after 3rd rejection');
      })
      .fork(() => {
        assert.fail('shouldn\'t get into the resolve branch');
      }, error => {
        assert.ok(catch1Entered);
        assert.ok(catch2Entered);
        assert.ok(catch3Entered);
        assert.ok(then1Entered);
        assertWithEmptyContext(error, { error: undefined });
        done();
      });
  });

  it('nesting catches', done => {
    let then1Entered = false;
    const nesting1 = () => Future.resolve().then(() =>
      Future.reject(1)
        .catch(() => 2)
    );
    const nesting2 = () => Future.resolve().then(() =>
      Future.reject(3)
        .then(() => 4)
    );
    Future.resolve(0)
      .then(nesting1)
      .then(value => {
        then1Entered = true;
        assert.equal(value, 2);
      })
      .then(nesting2)
      .then(() => {
        assert.fail('shouldn\'t get into the resolve branch');
      })
      .fork(() => {
        assert.fail('shouldn\'t get into the resolve branch');
      }, error => {
        assert.ok(then1Entered);
        assertWithEmptyContext(error, { error: 3 });
        done();
      });
  });

  it('returning nothing in catches', done => {
    let catch1Entered = false;
    let then1Entered = false;
    Future.reject()
      .catch(() => {
        catch1Entered = true;
      })
      .then(() => {
        then1Entered = true;
      })
      .fork(result => {
        assert.ok(catch1Entered);
        assert.ok(then1Entered);
        assertWithEmptyContext(result, { value: undefined });
        done();
      });
  });

  it('throwing exceptions inside clauses', done => {
    Future.resolve()
      .then(result => {
        result.a = 1;
      }).catch(error => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, 'Cannot set property \'a\' of undefined');
        error.b.c = 3;
      })
      .fork(() => {
        assert.fail('shouldn\'t get into the resolve branch');
      }, error => {
        assert.ok(error);
        assert.ok(error.error);
        assert.ok(error.error instanceof Error);
        assert.equal(error.error.message, 'Cannot set property \'c\' of undefined');
        done();
      })
  });

  it('invalid input', done => {
    assert.throws(() => {
      Future.resolve(2).catch('aa');
    }, {
      name: 'TypeError',
      message: 'catch() expects a function as parameter',
    });

    assert.throws(() => {
      Future.reject(2).catch('aa');
    }, {
      name: 'TypeError',
      message: 'catch() expects a function as parameter',
    });
    done();
  });
});
