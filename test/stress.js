const f = require('fluture');
const Future = require('../index');

const factorial = n => n === 0 ? 1 : factorial(n - 1);

// factorial(100000);

const m = (function recur (x) {
  const mx = f.resolve (x + 1);
  return x < 1000 ? f.chain (recur) (mx) : mx;
  // return x < 1000000 ? mx.pipe(f.chain(recur)) : mx;
}(1));

const M = (function recur (x) {
  const mx = Future.resolve (x + 1);
  return x < 1000000 ? mx.then(recur) : mx;
}(1));

const p = (function recur (x) {
  const mx = Promise.resolve(x+1);
  return x < 1000000 ? mx.then(recur) : mx;
});

let F = Future.resolve(1);
for (i = 0; i < 1000000; i++) {
  F = F.then(x => x+1);
}

const begin = Date.now();
F.fork(result => {
  const end = Date.now();
  console.log(result);
  console.log((end-begin)/1000);
});

// p(1).then(res => {
//   const end = Date.now();
//   console.log((end-begin)/1000);
// });

// M.fork(() => {
//   const end = Date.now();
//   console.log((end-begin)/1000);
// })(console.log);


// f.fork(console.log)(() => {
//   const end = Date.now();
//   console.log((end-begin)/1000);
// })(m);
