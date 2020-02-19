// TODO: assert & verify & error codes

const f = require('fluture');
const r = require('ramda');
const assert = require('assert');

class Future {
  constructor(input) {
    if (f.isFuture(input)) {
      this._f = input;
      return;
    }
    assert.ok(typeof input === 'function', 'Constructor expects a function as parameter');
    this._f = f((reject, resolve) => {
      try {
        input(resolve, reject);
      } catch (e) {
        reject(e);
      }
      return () => {};
    })
      .pipe(f.chain(value => f.resolve({ value, context: Future._initContext() })))
      .pipe(f.chainRej(error => f.reject({ error, context: Future._initContext() })));
  }


  _wrap(func, isCaught) {
    return (result) => {
      let output;
      try {
        output = func(isCaught ? result.error : result.value);
      } catch (ex) {
        output = Future.reject(ex);
      }
      const outputFuture = output instanceof Future ? output : Future.resolve(output);
      return outputFuture._f
        .pipe(f.chain(payload =>
          f.resolve({
            value: payload.value,
            context: Future._mergeContext(result.context, payload.context),
          })
        ))
        .pipe(f.chainRej(payload =>
          f.reject({
            error: payload.error,
            context: Future._mergeContext(result.context, payload.context),
          })
        ));
    }
  }

  then(func) {
    return new Future(this._f.pipe(f.chain(this._wrap(func))));
  }

  catch(func) {
    return new Future(this._f.pipe(f.chainRej(this._wrap(func, true))));
  }

  tag(name, data) {
    const context = { tags: [{ name, data }] };
    return new Future(this._f.pipe(f.chain(
      payload => f.resolve({
        value: payload.value,
        context: Future._mergeContext(payload.context, context),
      })
    )));
  }

  fork(resolve, reject) {
    resolve = resolve || (() => {});
    reject = reject || (() => {});
    return f.fork(reject)(resolve)(this._f);
  }

  static _mergeContext(c1, c2) {
    const newContext = r.clone(c1);
    const newTags = r.concat(c1.tags || [], c2.tags || []);
    if (!r.isEmpty(newTags)) {
      newContext.tags = newTags;
    }
    return newContext;
  }

  static _mergeContextArray(contexts) {
    return r.reduce(Future._mergeContext, Future._initContext(), contexts);
  }

  static _initContext() {
    return {};
  }

  static resolve(value) {
    return new Future(f.resolve({ value, context: Future._initContext() }));
  }

  static reject(error) {
    return new Future(f.reject({ error, context: Future._initContext() }))
  }

  static after(miliseconds, value) {
    return new Future(f.after(miliseconds)({ value, context: Future._initContext() }));
  }

  static rejectAfter(miliseconds, error) {
    return new Future(f.rejectAfter(miliseconds)({ error, context: Future._initContext() }));
  }

  static encaseF(func) {
    return (...args) => {
      try {
        return Future.resolve(func(...args));
      } catch (e) {
        return Future.reject(e);
      }
    }
  }

  static encaseP(func) {
    return (...args) => {
      return new Future((resolve, reject) => {
        try {
          func(...args)
            .then(resolve)
            .catch(reject);
        } catch (e) {
          reject(e);
        }
      });
    };
  }

  static encaseC(func) {
    return (...args) => {
      return new Future((resolve, reject) => {
        try {
          func(...args, (error, result) => {
            if (!r.isNil(error)) {
              return reject(error);
            }
            return resolve(result);
          });
        } catch (e) {
          reject(e);
        }
      });
    };
  }

  static all(futures, options = {}) {
    const limit = options.limit || Infinity;
    const futureMap = options.ignoreError ?
      future => future.catch(Future.resolve)._f :
      future => future._f;
    const allFuture = f
      .parallel(limit)(r.map(futureMap, futures))
      .pipe(f.chain(results => f.resolve({
        value: results.map(result => result.value),
        context: options.saveAllContexts ?
          Future._mergeContextArray(results.map(result => result.context)) :
          r.pathOr(Future._initContext(), [0, 'context'], results),
      })));

    return new Future(allFuture);
  }
}

module.exports = Future;
