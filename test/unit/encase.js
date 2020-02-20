const assert = require('assert');

const Future = require('../../index');
const utils = require('./utils');

const assertWithEmptyContext = utils.assertWithEmptyContext;

describe(':: encaseF', () => {
  it('no error', done => {
    const future = Future.encaseF((a, b = 2, c) => (a || 0) + (b || 0) + (c || 0));
    future(2, 3, 5).fork(result => {
      assertWithEmptyContext(result, { value: 10 });
    }, () => {
      assert.fail('shouldn\'t get into the reject branch');
    });
    future(2, 3).then(num => num + 20).fork(result => {
      assertWithEmptyContext(result, { value: 25 });
    }, () => {
      assert.fail('shouldn\'t get into the reject branch');
    });
    future(2).catch(() => {
      assert.fail('shouldn\'t get into the reject branch');
    }).fork(result => {
      assertWithEmptyContext(result, { value: 4 });
    }, () => {
      assert.fail('shouldn\'t get into the reject branch');
    });
    future().fork(result => {
      assertWithEmptyContext(result, { value: 2 });
    }, () => {
      assert.fail('shouldn\'t get into the reject branch');
    });
    future(2, 3, 5, 8).fork(result => {
      assertWithEmptyContext(result, { value: 10 });
    }, () => {
      assert.fail('shouldn\'t get into the reject branch');
    });
    setTimeout(done, 10);
  });

  it('throws exception', done => {
    Future
      .encaseF((a, b) => { throw 'zz'; })(1)
      .fork(() => {
        assert.fail('shouldn\'t get into the resolve branch');
      }, error => {
        assertWithEmptyContext(error, { error: 'zz' });
        done();
      });
  });

  it('invalid input', done => {
    assert.throws(() => {
      Future.encaseF('');
    }, {
      name: 'TypeError',
      message: 'encaseF() expects a function as parameter',
    });
    done();
  });
});

describe(':: encaseP', () => {
  it('no error', done => {
    Future
      .encaseP(
        (a, b) => Promise.resolve((a || 0) + (b || 0))
          .then(num => num + 10)
      )(3)
      .then(num => num + 20)
      .catch(() => {
        assert.fail('shouldn\'t get into the reject branch');
      })
      .fork(result => {
        assertWithEmptyContext(result, { value: 33 });
        Future.encaseP((a, b) => Promise.resolve(a + b))(3, 2)
          .fork(result2 => {
            assertWithEmptyContext(result2, { value: 5 });
            done();
          }, () => {
            assert.fail('shouldn\'t get into the reject branch');
          });
      }, () => {
        assert.fail('shouldn\'t get into the reject branch');
      });
  });

  it('reject', done => {
    const rejectFunc = (a, b = 3) => Promise.reject((a || 0) + (b || 0));
    Future.encaseP(rejectFunc)(2).fork(() => {
      assert.fail('shouldn\'t get into the resolve branch');
    }, error => {
      assertWithEmptyContext(error, { error: 5 });

      Future.encaseP(rejectFunc)()
        .then(() => {
          assert.fail('shouldn\'t get into the resolve branch');
        })
        .catch(error => {
          assert.equal(error, 3);
        })
        .fork(result => {
          assertWithEmptyContext(result, { value: undefined });
          done();
        }, (error) => {
          assert.fail('shouldn\'t get into the reject branch');
        });
    });
  });

  it('throws exception', done => {
    const throwFunc = (a, b = 3) => { throw ((a || 0) + (b || 0)); };
    Future.encaseP(throwFunc)(2).fork(() => {
      assert.fail('shouldn\'t get into the resolve branch');
    }, error => {
      assertWithEmptyContext(error, { error: 5 });

      Future.encaseP(throwFunc)()
        .then(() => {
          assert.fail('shouldn\'t get into the resolve branch');
        })
        .catch(error => {
          assert.equal(error, 3);
        })
        .fork(result => {
          assertWithEmptyContext(result, { value: undefined });
          done();
        }, (error) => {
          assert.fail('shouldn\'t get into the reject branch');
        });
    });
  });

  it('invalid input', done => {
    assert.throws(() => {
      Future.encaseP(0);
    }, {
      name: 'TypeError',
      message: 'encaseP() expects a function as parameter',
    });
    done();
  });
});

describe(':: encaseC', done => {
  it('no error', done => {
    const cbFunc = (a, b, c, cb) => {
      setTimeout(() => cb(null, a + b + c), 10);
    };
    const cbFunc2 = cb => setTimeout(() => cb(), 10);
    Future.encaseC(cbFunc)(1, 3, 4)
      .then(num => num + 10)
      .catch(() => {
        assert.fail('shouldn\'t get into the reject branch');
      })
      .fork(result => {
        assertWithEmptyContext(result, { value: 18 });
        Future.encaseC(cbFunc2)()
          .fork(result2 => {
            assertWithEmptyContext(result2, { value: undefined });
            done();
          }, () => {
            assert.fail('shouldn\'t get into the reject branch');
          });
      }, () => {
        assert.fail('shouldn\'t get into the reject branch');
      });
  });

  it('returns error', done => {
    const cbFunc = (a, b, c, cb) => {
      setTimeout(() => cb(a + b + c, 2), 10);
    };
    const cbFunc2 = cb => {
      setTimeout(() => cb(''), 10);
    };
    Future.encaseC(cbFunc)(2, 3, 4).fork(() => {
      assert.fail('shouldn\'t get into the resolve branch');
    }, error => {
      assertWithEmptyContext(error, { error: 9 });

      Future.encaseC(cbFunc2)()
        .then(() => {
          assert.fail('shouldn\'t get into the resolve branch');
        })
        .catch(error => {
          assert.equal(error, '');
          return error;
        })
        .fork(result => {
          assertWithEmptyContext(result, { value: '' });
          done();
        }, (error) => {
          assert.fail('shouldn\'t get into the reject branch');
        });
    });
  });

  it('throws exception', done => {
    const throwFunc = (a, cb) => { throw a + 1; cb(); };
    Future.encaseC(throwFunc)(2).fork(() => {
      assert.fail('shouldn\'t get into the resolve branch');
    }, error => {
      assertWithEmptyContext(error, { error: 3 });

      Future.encaseC(throwFunc)(0)
        .then(() => {
          assert.fail('shouldn\'t get into the resolve branch');
        })
        .catch(error => {
          assert.equal(error, 1);
        })
        .fork(result => {
          assertWithEmptyContext(result, { value: undefined });
          done();
        }, (error) => {
          assert.fail('shouldn\'t get into the reject branch');
        });
    });
  });

  it('invalid input', done => {
    assert.throws(() => {
      Future.encaseC([]);
    }, {
      name: 'TypeError',
      message: 'encaseC() expects a function as parameter',
    });
    done();
  });
});
