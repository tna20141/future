const arr = [];

function create() {
  return {
    a: 1,
    b: '2222222222222222222222',
    c: {
      d: '333333333333333'
    }
  };
}

function createFunc() {
  let o = create();
  return () => {
    // o.e = 1;
    return null;
  };
}

for (i = 0; i < 95000; i++) {
  arr.push(createFunc());
}

setTimeout(() => {
  console.log(arr.length);
}, 5000);
