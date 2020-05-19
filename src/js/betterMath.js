let sinLookup = new Array(360);
let randLookupArr = [];
let randLookupKey = 1e6;

export function sin(radians) {
  return sinLookup[Math.round(radians * 180 / Math.PI)];
}

export function random() {
  return ++randLookupKey >= randLookupArr.length ? randLookupArr[randLookupKey = 0] : randLookupArr[randLookupKey];
}

function create() {
  for (let i = 0; i < 360; i++) {
    sinLookup[i] = Math.sin(i * Math.PI / 180);
  }

  for (; randLookupKey >= 0; randLookupKey--) {
    randLookupArr.push(Math.random());
  }
}

create();