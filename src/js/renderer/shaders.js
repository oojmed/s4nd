import * as BetterMath from '/js/betterMath';

export let shaders = {
  'sand': (t) => ({ r: 250 - (t.rand * 40), g: 200 - (t.rand * 30), b: 55, a: 255 }),
  'water': (t) => ({ r: 60 - (t.rand * 40), g: 190 - (t.rand * 20), b: 230, a: 200 }),
  'crude_oil': (t) => ({ r: 100 - (t.rand * 20), g: 100 - (t.rand * 20), b: 100 - (t.rand * 20), a: 200 }),
  'wall': (t) => ({ r: 120 - (t.rand * 45), g: 120 - (t.rand * 40), b: 120 - (t.rand * 35) + (t.faucet === undefined ? 0 : 150), a: 255 }),
  'lava': (t) => ({ r: 230, g: 125 - (t.rand * 20), b: 10 + (t.rand * 30), a: 250 }),
  'stone': (t) => ({ r: 200 - (t.rand * 40), g: 200 - (t.rand * 40), b: 200 - (t.rand * 40), a: 255 }),
  'glass': (t) => ({ r: 250 - (t.rand * 20), g: 250 - (t.rand * 20), b: 250 - (t.rand * 20), a: 230 }),
  'air': (t) => ({ r: 0, g: 0, b: 20 / (t.faucet === undefined ? 0 : 0), a: 20 - (0 / t.age) }), // you may be wondering why age is being used here, and it's because if t.age is used in only one function (fire) then JIT breaks it in browsers (at least in chromium)
  'fire': (t) => ({ r: 255, g: 65 + (t.rand * 20), b: 25 + (t.rand * 30), a: (BetterMath.sin(t.age * 22) + 0.1) * 255 }),
  'acid': (t) => ({ r: 80 - (t.rand * 70), g: 225, b: 80 - (t.rand * 65), a: 200}),
  'gunpowder': (t) => ({r: 50 - (t.rand * 40), g: 50 - (t.rand * 40), b: 50 - (t.rand * 40), a: 255}),
  'dirt': (t) => ({r: 180 - (t.rand * 60), g: 80 - (t.rand * 40), b: 10, a: 255}),
  'grass': (t) => ({r: 40, g: 230 - (t.rand * 60), b: 50, a: 255}),
  'wood': (t) => ({r: 240 - (t.rand * 40), g: 120 - (t.rand * 20), b: 20, a: 255}),
  'concrete': (t) => ({r: 150 - (t.rand * 20), g: 150 - (t.rand * 20), b: 150 - (t.rand * 20), a: 180})
};