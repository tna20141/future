const f = require('fluture');

function _isNil(val) {
  return val === undefined || val === null;
}

class Future {
  constructor(input) {
    if (f.isFuture(input)) {
      this._f = input;
      return;
    }

    if (typeof input !== 'function') {
      throw new TypeError('constructor expects a function as parameter');
    }

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
    return result => {
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
    if (typeof func !== 'function') {
      throw new TypeError('then() expects a function as parameter');
    }
    return new Future(this._f.pipe(f.chain(this._wrap(func))));
  }

  catch(func) {
    if (typeof func !== 'function') {
      throw new TypeError('catch() expects a function as parameter');
    }
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
    const newContext = {};
    const newTags = (c1.tags || []).concat(c2.tags || []);
    if (newTags.length) {
      newContext.tags = newTags;
    }
    return newContext;
  }

  static _mergeContextArray(contexts) {
    return contexts.reduce(Future._mergeContext, Future._initContext());
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
    if (typeof func !== 'function') {
      throw new TypeError('encaseF() expects a function as parameter');
    }
    return (...args) => {
      try {
        return Future.resolve(func(...args));
      } catch (e) {
        return Future.reject(e);
      }
    }
  }

  static encaseP(func) {
    if (typeof func !== 'function') {
      throw new TypeError('encaseP() expects a function as parameter');
    }
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
    if (typeof func !== 'function') {
      throw new TypeError('encaseC() expects a function as parameter');
    }
    return (...args) => {
      return new Future((resolve, reject) => {
        try {
          func(...args, (error, result) => {
            if (!_isNil(error)) {
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
    if (!Array.isArray(futures)) {
      throw new TypeError('all() expects an array as parameter');
    }
    if (!_isNil(options.limit) && options.limit !== Infinity &&
      (!Number.isInteger(options.limit) || options.limit < 1)) {
      throw new TypeError('options.limit is not a positive integer');
    }
    if (!_isNil(options.ignoreError) && typeof options.ignoreError !== 'boolean') {
      throw new TypeError('options.ignoreError is not a boolean');
    }
    if (!_isNil(options.saveAllContexts) && typeof options.saveAllContexts !== 'boolean') {
      throw new TypeError('options.saveAllContexts is not a boolean');
    }
    const limit = options.limit || Infinity;
    const futureMap = options.ignoreError ?
      future => future.catch(Future.resolve)._f :
      future => future._f;
    const inputMap = input => input instanceof Future ?
      futureMap(input) :
      Future.resolve(input)._f;
    const allFuture = f
      .parallel(limit)(futures.map(inputMap))
      .pipe(f.chain(results => f.resolve({
        value: results.map(result => result.value),
        context: options.saveAllContexts ?
          Future._mergeContextArray(results.map(result => result.context)) :
          results.length ? results[0].context : Future._initContext(),
      })));

    return new Future(allFuture);
  }
}

module.exports = Future;
