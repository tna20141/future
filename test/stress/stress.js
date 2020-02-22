const f = require('fluture');
const Future = require('../../index');

const factorial = n => n === 0 ? 1 : factorial(n - 1);

// factorial(100000);

// const m = (function recur (x) {
//   const mx = f.resolve (x + 1);
//   const r = x < 50000000 ? f.chain(recur)(mx) : mx;
//   // return f.chain(a => f.resolve(a))(r);
//   return r;
// });

// 3796418
const M = (function recur (x) {
  const mx = Future.resolve (x + 1);
  return x < 10000000 ? mx.then(recur) : mx;
});

// const p = (function recur (x) {
//   const mx = Promise.resolve(x+1);
//   return x < 1000000 ? mx.then(recur) : mx;
// });

// let F = Future.resolve(1);
// let fn = x => x+ 1;
// for (i = 0; i < 10000000; i++) {
//   F = F.then(fn);
// }

// let m = f.resolve(1);
// for (i = 0; i < 10000000; i++) {
//   // m = m.pipe(f.chain(f.resolve));
//   let temp = m;
//   m = f.resolve(1).pipe(f.chain(() => temp));
// }

console.log('fork');
const begin = Date.now();

// F.fork(result => {
M(1).fork(result => {
  const end = Date.now();
  console.log(result);
  console.log((end-begin)/1000);
});

// p(1).then(res => {
//   const end = Date.now();
//   console.log((end-begin)/1000);
// });

// f.fork(console.log)(() => {
//   const end = Date.now();
//   console.log((end-begin)/1000);
// // })(m(1));
// })(m);
