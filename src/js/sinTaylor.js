export let sinLookup = new Array(360);

export function betterSinRadians(radians) {
  return sinLookup[Math.round(radians * 180 / Math.PI)];
}

export function create() {
  for (var i = 0; i < 360; i++) {
    sinLookup[i] = Math.sin(i * Math.PI / 180);
  }
}

create();