const assert = require('assert');

const Future = require('../../index');
const utils = require('./utils');

const assertWithEmptyContext = utils.assertWithEmptyContext;
const timeoutOffset = 15;
const timeoutOffsetLeft = 5;

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

  it('limiting parallelism', done => {
    const _assertParallelism = (limit, expectedTime, expectedOrder, saveAllContexts) => {
      let order = [];
      const payload = (time, val) => new Future(resolve =>
        setTimeout(() => {
          order.push(val);
          resolve(val);
        }, time)
      ).tag(val.toString());

      const futures = [
        payload(300, 1),
        payload(100, 2),
        payload(0, 3),
        payload(400, 4),
        payload(250, 5),
      ];

      const options = {};
      if (limit !== undefined) {
        options.limit = limit;
      }
      options.saveAllContexts = saveAllContexts;
      const expectedResult = saveAllContexts ?
        { value: [1, 2, 3, 4, 5], context: { tags: [
          { name: '1', data: undefined },
          { name: '2', data: undefined },
          { name: '3', data: undefined },
          { name: '4', data: undefined },
          { name: '5', data: undefined },
        ] } } :
        { value: [1, 2, 3, 4, 5], context: { tags: [{ name: '1', data: undefined }] } };

      const begin = Date.now();
      Future.all(futures, options)
        .fork(result => {
          const end = Date.now();
          const diff = end - begin;
          assert.deepEqual(order, expectedOrder);
          assert.deepEqual(result, expectedResult);
          assert.ok(diff > expectedTime - timeoutOffsetLeft && diff < expectedTime + timeoutOffset,
            `expected: ${expectedTime}, actual: ${diff}`);
        }, () => {
          assert.fail('shouldn\'t get into the reject branch');
        });
    }

    _assertParallelism(undefined, 400, [3, 2, 5, 1, 4], true);
    _assertParallelism(Infinity, 400, [3, 2, 5, 1, 4], true);
    _assertParallelism(1, 1050, [1, 2, 3, 4, 5], true);
    _assertParallelism(2, 550, [2, 3, 1, 4, 5], true);
    _assertParallelism(3, 400, [3, 2, 1, 5, 4], true);
    _assertParallelism(4, 400, [3, 2, 5, 1, 4], false);
    _assertParallelism(5, 400, [3, 2, 5, 1, 4], true);
    _assertParallelism(9, 400, [3, 2, 5, 1, 4], true);

    setTimeout(done, 1200);
  });

  it('parallelism with rejections', done => {
    const _assertParallelismWithRejections =
      (limit, expectedTime, expectedOrder, expectedError) => {
        let order = [];
        const payload = (time, val, isRejection) => new Future((resolve, reject) =>
          setTimeout(() => {
            order.push(val);
            isRejection ? reject(val) : resolve(val);
          }, time)
        );

        const futures = [
          payload(100, 1),
          payload(450, 2, true),
          payload(0, 3),
          payload(300, 4),
          payload(250, 5, true),
        ];

        const options = {};
        if (limit !== undefined) {
          options.limit = limit;
        }

        const begin = Date.now();
        Future.all(futures, options)
          .fork(() => {
            assert.fail('shouldn\'t get into the resolve branch');
          }, error => {
            const end = Date.now();
            const diff = end - begin;
            assert.deepEqual(order, expectedOrder);
            assertWithEmptyContext(error, { error: expectedError });
            assert.ok(
              diff > expectedTime - timeoutOffsetLeft &&
              diff < expectedTime + timeoutOffset,
              `expected: ${expectedTime}, actual: ${diff}`);
          });
      }

    _assertParallelismWithRejections(undefined, 250, [3, 1, 5], 5);
    _assertParallelismWithRejections(Infinity, 250, [3, 1, 5], 5);
    _assertParallelismWithRejections(1, 550, [1, 2], 2);
    _assertParallelismWithRejections(2, 450, [1, 3, 4, 2], 2);
    _assertParallelismWithRejections(3, 350, [3, 1, 4, 5], 5);
    _assertParallelismWithRejections(4, 250, [3, 1, 5], 5);
    _assertParallelismWithRejections(5, 250, [3, 1, 5], 5);
    _assertParallelismWithRejections(9, 250, [3, 1, 5], 5);

    setTimeout(done, 1200);
  });

  it('ignoring errors', done => {
    const payload = (time, val, isRejection) =>
      Future
        .resolve()
        .tag(val.toString())
        .then(() => new Future((resolve, reject) =>
          setTimeout(() => {
            isRejection ? reject(val) : resolve(val);
          }, time)
        ).tag(val.toString() + 'later'));
    const futures = [
      payload(100, 1),
      payload(0, 2, true),
      payload(200, 3),
      payload(400, 4),
      payload(300, 5, true),
    ];

    Future.all(futures, { ignoreError: true, limit: 3, saveAllContexts: true })
      .then(arr => arr.concat('more'))
      .fork(result => {
        assert.deepEqual(result, {
          value: [1, 2, 3, 4, 5, 'more'],
          context: { tags: [
            { name: '1', data: undefined },
            { name: '1later', data: undefined },
            { name: '2', data: undefined },
            { name: '3', data: undefined },
            { name: '3later', data: undefined },
            { name: '4', data: undefined },
            { name: '4later', data: undefined },
            { name: '5', data: undefined },
          ] },
        });

        Future.all([
          payload(200, 1, true),
          payload(100, 2, true),
        ], { ignoreError: true })
          .catch(() => {
            assert.fail('shouldn\'t get into the reject branch');
          })
          .fork(result => {
            assert.deepEqual(result, {
              value: [1, 2],
              context: { tags: [
                { name: '1', data: undefined },
              ] },
            });
            done();
          }, () => {
            assert.fail('shouldn\'t get into the reject branch');
          })
      }, () => {
        assert.fail('shouldn\'t get into the reject branch');
      });
  });

  it('resolving value', done => {
    Future.all([1])
      .then(arr => arr.concat(2))
      .fork(result => {
        assertWithEmptyContext(result, { value: [1, 2] });
      }, () => {
        assert.fail('shouldn\'t get into the reject branch');
      });

    Future.all(['aa', { b: 1 }])
      .fork(result => {
        assertWithEmptyContext(result, { value: ['aa', { b: 1 }] });
      }, () => {
        assert.fail('shouldn\'t get into the reject branch');
      });

    Future.all([
      Future.resolve(3),
      ['z', 'zz', { b: 3 }],
      Future.resolve(2).then(Future.reject),
      null,
      Future.rejectAfter(200, 'r'),
      undefined,
    ], { limit: 2, ignoreError: true })
      .fork(result => {
        assertWithEmptyContext(result, { value: [
          3,
          ['z', 'zz', { b: 3 }],
          2,
          null,
          'r',
          undefined,
        ] });
      }, () => {
        assert.fail('shouldn\'t get into the reject branch');
      });

    setTimeout(done, 500);
  });

  it('invalid input', done => {
    assert.throws(() => {
      Future.all({ a: Future.resolve(1) })
        .then(() => {
          assert.fail('shouldn\'t get into the resolve branch');
        });
    }, {
      name: 'TypeError',
      message: 'all() expects an array as parameter',
    });

    assert.throws(() => {
      Future.all([], { limit: 0 })
        .then(() => {
          assert.fail('shouldn\'t get into the resolve branch');
        });
    }, {
      name: 'TypeError',
      message: 'options.limit is not a positive integer',
    });

    assert.throws(() => {
      Future.all([], { ignoreError: '' })
        .then(() => {
          assert.fail('shouldn\'t get into the resolve branch');
        });
    }, {
      name: 'TypeError',
      message: 'options.ignoreError is not a boolean',
    });

    assert.throws(() => {
      Future.all([], { saveAllContexts: 0 })
        .then(() => {
          assert.fail('shouldn\'t get into the resolve branch');
        });
    }, {
      name: 'TypeError',
      message: 'options.saveAllContexts is not a boolean',
    });

    done();
  });
});
