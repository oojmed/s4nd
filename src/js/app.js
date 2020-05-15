import * as PerfOverlay from './perfOverlay';
import { addTime } from './exportedVars';
import { betterSinAngle, betterSinRadians } from './sinTaylor';

export let canvas, ctx;
export let fps = 0;
let lastCalledTime;

let frame = 0;

let useRequestAnim = false;

let tiles = [];

let scaleFactor = 12;

let sizeWidth = Math.floor(window.innerWidth / scaleFactor);
let sizeHeight = Math.floor(window.innerHeight / scaleFactor);

let imgData;
let pixels;

let fpsEl, materialSelectEl, faucetCheckboxEl, scaleSelectEl, cursorSelectEl, frameLockCheckboxEl;

let baseTile = { material: 'air', typeUpdated: false, reactionUpdated: false, rand: 0, age: 0 };

let mousePos = {x: 0, y: 0};
let mouseDrawInterval;
let mouseDrawSize = 1;
let mouseDown = false;

let faucetOn = false;

let materials = ['water', 'crude_oil', 'lava', 'acid', 'sand', 'gunpowder', 'glass', 'stone', 'wall', 'air', 'fire'];
let mouseSelected = 'water';
let oldMouseSelected = undefined;

let materialColors = {
  'sand': (t) => ({ r: 250 - (t.rand * 40), g: 201 - (t.rand * 30), b: 55, a: 255 }),
  'water': (t) => ({ r: 60 - (t.rand * 40), g: 190 - (t.rand * 20), b: 230, a: 150 }),
  'crude_oil': (t) => ({ r: 100 - (t.rand * 20), g: 100 - (t.rand * 20), b: 100 - (t.rand * 20), a: 150 }),
  'wall': (t) => ({ r: 120 - (t.rand * 45), g: 120 - (t.rand * 40), b: 120 - (t.rand * 35) + (t.faucet === undefined ? 0 : 150), a: 255 }),
  'lava': (t) => ({ r: 230, g: 125 - (t.rand * 20), b: 10 + (t.rand * 30), a: 150 }),
  'stone': (t) => ({ r: 200 - (t.rand * 40), g: 200 - (t.rand * 40), b: 200 - (t.rand * 40), a: 255 }),
  'glass': (t) => ({ r: 250 - (t.rand * 20), g: 250 - (t.rand * 20), b: 250 - (t.rand * 20), a: 230 }),
  'air': (t) => ({ r: 0, g: 0, b: 20 / (t.faucet === undefined ? 0 : 0), a: 20 - (0 / t.age) }), // you may be wondering why age is being used here, and it's because if t.age is used in only one function (fire) then JIT breaks it in browsers (at least in chromium)
  'fire': (t) => ({ r: 255, g: 65 + (t.rand * 20), b: 25 + (t.rand * 30), a: (betterSinRadians(t.age * 22) + 0.3) * 255 }),
  'acid': (t) => ({ r: 80 - (t.rand * 70), g: 225, b: 80 - (t.rand * 65), a: 200}),
  'gunpowder': (t) => ({r: 50 - (t.rand * 40), g: 50 - (t.rand * 40), b: 50 - (t.rand * 40), a: 255})
};

let densityLookup = {
  'sand': 500,
  'glass': 800,
  'wall': 9999,
  'stone': 700,
  'gunpowder': 300,
  
  'air': 5,
  'fire': 200,
  
  'water': 50,
  'crude_oil': 30,
  'lava': 100,
  'acid': 20
};

let staticLookup = {
  'water': false,
  'crude_oil': false,
  'lava': false,
  'acid': false,
  'gunpowder': false,

  'sand': false,
  'stone': false,
  'glass': false,
  
  'fire': true,
  'air': true,
  'wall': true
};

let liquidLookup = {
  'water': true,
  'lava': true,
  'crude_oil': true,
  'acid': true,

  'gunpowder': false,
  'sand': false,
  'stone': false,
  'wall': false,
  'glass': false,
  
  'fire': false,
  'air': false,
};

let floatLookup = {
  'water': false,
  'crude_oil': false,
  'lava': false,
  'acid': false,
  'gunpowder': false,

  'sand': false,
  'stone': false,
  'glass': false,
  
  'air': false,
  'wall': false,

  'fire': true
};

let oldAgeLookup = {
  'water': false,
  'crude_oil': false,
  'lava': false,
  'acid': false,

  'gunpowder': false,
  'sand': false,
  'stone': false,
  'glass': false,
  
  'air': false,
  'wall': false,

  'fire': 0.15
};

let reactions = [
  {reactants: ['water', 'lava'], product: 'stone'},
  {reactants: ['sand', 'lava'], product: 'glass'},
  {reactants: ['crude_oil', 'lava'], product: 'fire', forced: 5, chance: 0.3},
  {reactants: ['crude_oil', 'fire'], product: 'fire', forced: 5, chance: 0.3},
  {reactants: ['water', 'fire'], product: 'air'},
  {reactants: ['acid', '*:not(wall,air)'], product: 'air', chance: 50},
  {reactants: ['gunpowder', 'fire'], product: 'fire', forced: 0.1, chance: 50},
  {reactants: ['gunpowder', 'lava'], product: 'fire', forced: 0.1, chance: 50}
];

function compileReactants() {
  for (let reaction of reactions.slice()) {
    let starReactant = reaction.reactants.find((x) => x.search(/\*/) !== -1);

    if (starReactant !== undefined) {
      let otherReactant = reaction.reactants[(reaction.reactants.indexOf(starReactant) === 0 ? 1 : 0)];

      let not = starReactant.split(':not(')[1] || '';
      not = not.slice(0, -1).split(',');

      let matchingMaterials = materials.filter((x) => !not.includes(x));

      for (let matchingMaterial of matchingMaterials) {
        reactions.push({reactants: [otherReactant, matchingMaterial], product: reaction.product, chance: reaction.chance, forced: reaction.forced});
      }
    }
  }
}

function initTiles() {
  let newTiles = Array.from(Array(sizeWidth), () => Array.apply(undefined, Array(sizeHeight)).map((x) => Object.assign({}, baseTile)));
  
  newTiles = newTiles.map((p, x) => p.map((t, y) => {
    t.rand = Math.random();

    t.x = x;
    t.y = y;

    return t;
  }));
  
  // border
  for (let x = 0; x < sizeWidth; x++) {
    newTiles[x][0].material = 'wall';
    newTiles[x][sizeHeight - 1].material = 'wall';
  }
  
  for (let y = 0; y < sizeHeight; y++) {
    newTiles[0][y].material = 'wall';
    newTiles[sizeWidth - 1][y].material = 'wall';
  }

  tiles = newTiles;
}

function initDropdown(options, parent, toSelect) {
  options.forEach((option) => {
    let el = document.createElement('option');
    el.setAttribute('value', option);

    if (option === toSelect) { el.setAttribute('selected', true); }

    let displayOption = option.toString().replace('_', ' ');
    el.innerText = displayOption[0].toUpperCase() + displayOption.substring(1);
    
    parent.appendChild(el);
  });
}

function initMaterialSelect() {
  initDropdown(materials, materialSelectEl, mouseSelected);
  
  materialSelectEl.onchange = function(e) {
    mouseSelected = materialSelectEl.value;
  };
}

function initCursorSelect() {
  initDropdown(["1x1", "2x2", "3x3", "4x4", "5x5"], cursorSelectEl, `${mouseDrawSize}x${mouseDrawSize}`);

  cursorSelectEl.onchange = function(e) {
    mouseDrawSize = parseFloat(cursorSelectEl.value[0]);
  };
}

function initScaleSelect() {
  initDropdown([2, 4, 6, 8, 10, 12, 14, 16, 18, 20], scaleSelectEl, scaleFactor);

  scaleSelectEl.onchange = function(e) {
    resizeCanvas();
  };
}

function resizeCanvas() {
  scaleFactor = parseFloat(scaleSelectEl.value);

  sizeWidth = Math.floor(window.innerWidth / scaleFactor);
  sizeHeight = Math.floor(window.innerHeight / scaleFactor);

  canvas.width = sizeWidth;
  canvas.height = sizeHeight;

  overlayCanvas.width = window.innerWidth;
  overlayCanvas.height = window.innerHeight;

  imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  pixels = imgData.data;

  initTiles();
}

function mouseDownHandler(e) {
  if (e.target.localName === 'select' || e.target.localName === 'option' || e.target.localName === 'input') return;

  let which = e.which || 1;

  if (which === 3) {
    oldMouseSelected = mouseSelected.slice();
    mouseSelected = 'air';
  }

  mousePos = {x: e.clientX, y: e.clientY};
  
  mouseDraw();
  
  mouseDrawInterval = setInterval(mouseDraw, 1);
  
  mouseDown = true;
}

function mouseMoveHandler(e) {
  mousePos = {x: e.clientX, y: e.clientY};

  let actualPosX = Math.floor(mousePos.x / scaleFactor);
  let actualPosY = Math.floor(mousePos.y / scaleFactor);

  let surrounding = Math.floor(mouseDrawSize / 2);
  let evenAdd = mouseDrawSize % 2 === 1 ? 0 : 1;

  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  let left = Math.floor(actualPosX - surrounding + evenAdd) * scaleFactor;
  let top = Math.floor(actualPosY - surrounding + evenAdd) * scaleFactor;

  overlayCtx.lineWidth = 1;
  overlayCtx.strokeStyle = 'white';

  let size = (surrounding * 2) - evenAdd + 1;

  overlayCtx.beginPath();
  overlayCtx.rect(left, top, Math.floor(scaleFactor * size), Math.floor(scaleFactor * size));
  overlayCtx.stroke();  
  
  if (mouseDown) mouseDraw();
}

function mouseUpHandler(e) {
  clearInterval(mouseDrawInterval);
  
  mouseDown = false;

  if (oldMouseSelected !== undefined) {
    mouseSelected = oldMouseSelected.slice();
    oldMouseSelected = undefined;
  }
}

function mouseDraw(pos = mousePos) {
  let actualPosX = Math.floor(pos.x / scaleFactor);
  let actualPosY = Math.floor(pos.y / scaleFactor);
  
  tiles[actualPosX][actualPosY].age = 0;

  if (faucetOn && oldMouseSelected === undefined) {
    tiles[actualPosX][actualPosY].material = 'wall';
    tiles[actualPosX][actualPosY].faucet = mouseSelected;

    return;
  }

  let surrounding = Math.floor(mouseDrawSize / 2);
  let evenAdd = mouseDrawSize % 2 === 1 ? 0 : 1;

  // console.log(actualPosX - surrounding + evenAdd, actualPosX + surrounding, (actualPosX + surrounding) - (actualPosX - surrounding + evenAdd));

  for (let x = actualPosX - surrounding + evenAdd; x <= actualPosX + surrounding; x++) {
    for (let y = actualPosY - surrounding + evenAdd; y <= actualPosY + surrounding; y++) {
      tiles[x][y].material = mouseSelected;
      tiles[x][y].faucet = undefined;
      tiles[x][y].age = 0;
    }
  }
}


let overlayCanvas, overlayCtx;

window.onload = function() {
  let startTime = performance.now();

  canvas = document.createElement('canvas');
  canvas.width = sizeWidth;
  canvas.height = sizeHeight;
  canvas.id = 'sandbox';

  canvas.style.width = '100%';
  canvas.style.height = '100%';

  overlayCanvas = document.createElement('canvas');
  overlayCanvas.width = sizeWidth * scaleFactor;
  overlayCanvas.height = sizeHeight * scaleFactor;
  overlayCanvas.id = 'overlay';

  overlayCanvas.style.width = '100%';
  overlayCanvas.style.height = '100%';
  
  document.body.prepend(overlayCanvas);
  document.body.prepend(canvas);
  
  ctx = canvas.getContext('2d');
  overlayCtx = overlayCanvas.getContext('2d');
  
  imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  pixels = imgData.data;
  
  fpsEl = document.getElementById('fps');

  materialSelectEl = document.getElementById('materialSelect');
  scaleSelectEl = document.getElementById('scaleSelect');
  frameLockCheckboxEl = document.getElementById('framelockCheckbox');
  faucetCheckboxEl = document.getElementById('faucetCheckbox');
  cursorSelectEl = document.getElementById('cursorSelect');

  frameLockCheckboxEl.onchange = function(e) {
    useRequestAnim = frameLockCheckboxEl.checked;
  };

  faucetCheckboxEl.onchange = function (e) {
    faucetOn = faucetCheckboxEl.checked;
  };

  initScaleSelect();
  initMaterialSelect();
  initCursorSelect();

  initTiles();
  compileReactants();

  let loadingTime = performance.now() - startTime;
  console.log(loadingTime);

  update();
  
  document.onmousedown = function(e) { mouseDownHandler(e); };
  document.onmousemove = function(e) { mouseMoveHandler(e); };
  document.onmouseup = function(e) { mouseUpHandler(e); };
  
  document.ontouchstart = function(e) { mouseDownHandler(e.touches[0]); };
  document.ontouchmove = function(e) { mouseMoveHandler(e.touches[0]); };
  document.ontouchend = function(e) { mouseUpHandler(e.touches[0]); };
  
  document.oncontextmenu = function(e) {
    e.preventDefault();
    return false;
  }

  window.onresize = function() {
    resizeCanvas();
  };

  document.onkeypress = function(e) {
    if (e.key === 'p') {
      if (PerfOverlay.enabled) {
        PerfOverlay.off();
      } else {
        PerfOverlay.on();
      }
    }
  };

  PerfOverlay.init();
};

function renderText(x, y, size, color, text, align) {
  ctx.font = `${size}px Roboto`;
  ctx.fillStyle = color;
  ctx.textAlign = align || 'center';
  
  ctx.fillText(text, x, y);
}

function moveTile(originalTile, newTile) {
  let originalMaterial = originalTile.material.slice();
  let originalAge = Number(originalTile.age);
  let originalReactionUpdated = Boolean(originalTile.reactionUpdated);

  originalTile.material = newTile.material;
  newTile.material = originalMaterial;
  
  newTile.typeUpdated = true;
  originalTile.typeUpdated = true;

  originalTile.age = newTile.age;
  newTile.age = originalAge;

  originalTile.reactionUpdated = newTile.reactionUpdated;
  newTile.reactionUpdated = originalReactionUpdated;
}

let lastStartTime;
let lastSecond = performance.now();
let recentAge = 0;
let factor = 0.01;

let ticksTotal = 0;
let ticksPerSecond = 0;

export function update() {
  let startTime = performance.now();
  let deltaTime = (startTime - lastStartTime) / 1000;
  deltaTime = isNaN(deltaTime) ? 0 : deltaTime;

  lastStartTime = startTime;

  // deltaTime += (200 - fps) / 2500000;
  //console.log((200 - fps) / 12);

  recentAge += deltaTime;

  if (recentAge / factor > 3) {
    recentAge = 0;
  }

  for (var ticksDone = 1; ticksDone < recentAge / factor; ticksDone++) for (let x = 0; x < sizeWidth; x++) {
    for (let y = 0; y < sizeHeight; y++) {
      // let realDeltaTime = deltaTime / Math.floor(recentAge / factor);

      let t = tiles[x][y];

      if (ticksDone === 1) t.age += deltaTime;

      let aboveTile = tiles[x][y - 1] || {material: 'nonExistant', typeUpdated: false, reactionUpdated: false};
      let belowTile = tiles[x][y + 1] || {material: 'nonExistant', typeUpdated: false, reactionUpdated: false};
      let sameLeftTile = x <= 0 ? {material: 'nonExistant', typeUpdated: false, reactionUpdated: false} : tiles[x - 1][y];
      let sameRightTile = x >= sizeWidth - 1 ? {material: 'nonExistant', typeUpdated: false, reactionUpdated: false} : tiles[x + 1][y];
      
      let adjacentNeighbours = [aboveTile, belowTile, sameLeftTile, sameRightTile];
      
      let adjSameCount = 0;
      let airCount = 0;
      let nonExistantCount = 0;
      for (let neighbour of adjacentNeighbours) {
        if (neighbour.material === t.material) adjSameCount++;
        if (neighbour.material === 'air') airCount++;
        if (neighbour.material === 'nonExistant') nonExistantCount++;
      }

      if (oldAgeLookup[t.material] !== false) {
        if (t.age > oldAgeLookup[t.material]) {
          t.material = 'air';
          t.age = 0;
        }
      }

      if (t.faucet !== undefined) {
        tiles[x][y + 1].material = t.faucet.slice();
        tiles[x][y + 1].age = 0;
      }

      let c = materialColors[t.material](t);

      let randIncrease = 0;
      randIncrease = liquidLookup[t.material] ? ((Math.random() * 2 - 1) / 20) : randIncrease;
      randIncrease = t.material === 'fire' ? ((Math.random() * 2 - 1) / 5) : randIncrease;

      t.rand += randIncrease;

      t.rand = t.rand > 1 ? 1 : t.rand;
      t.rand = t.rand < 0 ? 0 : t.rand;

      if (t.material !== 'wall' && adjSameCount + airCount + nonExistantCount !== 4) {
        let orig = Number(t.rand);
        t.rand = 2;

        c = materialColors[t.material](t);

        t.rand = orig;
      }

      if (adjSameCount !== 4) {
        if (!staticLookup[t.material]) {
          let bottom = y === sizeHeight - 1;
          
          if (!bottom && !t.typeUpdated) {
            if (densityLookup[belowTile.material] < densityLookup[t.material]) {
              moveTile(t, belowTile);
            } else {
              let belowLeftTile = x <= 0 ? {material: 'nonExistant', typeUpdated: false, reactionUpdated: false} : tiles[x - 1][y + 1];
              let belowRightTile = x >= sizeWidth - 1 ? {material: 'nonExistant', typeUpdated: false, reactionUpdated: false} : tiles[x + 1][y + 1];
              
              let belowLeftAvaliable = densityLookup[belowLeftTile.material] < densityLookup[t.material];
              let belowRightAvaliable = densityLookup[belowRightTile.material] < densityLookup[t.material];
              
              if (belowLeftAvaliable && belowRightAvaliable) {
                if (Math.random() >= 0.5) {
                  moveTile(t, belowRightTile);
                } else {
                  moveTile(t, belowLeftTile);
                }
              } else {
                if (belowLeftAvaliable) {
                  moveTile(t, belowLeftTile);
                }
                
                if (belowRightAvaliable) {
                  moveTile(t, belowRightTile);
                }
              }
              
              if (!belowLeftAvaliable && !belowLeftAvaliable && liquidLookup[t.material] && Math.random() > 0.1) {
                let sameLeftAvaliable = densityLookup[sameLeftTile.material] < densityLookup[t.material];
                let sameRightAvaliable = densityLookup[sameRightTile.material] < densityLookup[t.material];
                
                if (sameLeftAvaliable && sameRightAvaliable) {
                  if (Math.random() >= 0.5) {
                    moveTile(t, sameRightTile);
                  } else {
                    moveTile(t, sameLeftTile);
                  }
                } else {
                  if (sameLeftAvaliable) {
                    moveTile(t, sameLeftTile);
                  }
                  
                  if (sameRightAvaliable) {
                    moveTile(t, sameRightTile);
                  }
                }
              }
            }
          }
        }
        
        for (let r of reactions) {
          if (!r.reactants.includes(t.material)) continue;
          
          for (let neighbouringTile of adjacentNeighbours) {
            if (neighbouringTile.material === t.material || neighbouringTile.reactionUpdated) continue;
            
            if (r.reactants.includes(neighbouringTile.material)) {
              if (Math.random() > (r.chance || 100) / 100) continue;

              let product = r.product.slice();
              
              t.material = product;
              neighbouringTile.material = product;

              t.reactionUpdated = true;
              neighbouringTile.reactionUpdated = true;

              t.age = 0;
              neighbouringTile.age = 0;

              if (r.forced !== undefined) {
                t.forced = [r.product.slice(), Number(r.forced)];
                neighbouringTile.forced = [r.product.slice(), Number(r.forced)];
              }

              break;
            }
          }
        }

        if (floatLookup[t.material]) {
          if (densityLookup[aboveTile.material] < densityLookup[t.material]) {
            moveTile(t, aboveTile);
          }
        }
      }
      
      if (t.forced !== undefined) {
        t.age = 0;
        t.material = t.forced[0];
        if (ticksDone === 1) t.forced[1] -= deltaTime;
    
        if (t.forced[1] <= 0) {
          t.forced = undefined;
          delete t.forced;
        }

        c = materialColors[t.material](t);
      }

      let off = (x + (y * sizeWidth)) * 4;

      pixels[off] = c.r;
      pixels[off + 1] = c.g;
      pixels[off + 2] = c.b;
      pixels[off + 3] = c.a;
    }
  }

  recentAge %= factor;
  ticksTotal += ticksDone - 1;

  if (performance.now() - lastSecond > 1000) {
    let nowSec = performance.now()
    lastSecond = nowSec;

    ticksPerSecond = ticksTotal;
    ticksTotal = 0;
  }

  ctx.putImageData(imgData, 0, 0);

  for (let x = 0; x < sizeWidth; x++) {
    for (let y = 0; y < sizeHeight; y++) {
      tiles[x][y].typeUpdated = false;
      tiles[x][y].reactionUpdated = false;
    }
  }

  frame++;

  if (useRequestAnim) {
    requestAnimationFrame(update);
  } else {
    setTimeout(update, 0);
  }

  let timeTaken = performance.now() - startTime;
  
  addTime(ticksDone - 1); //timeTaken);

  if (!lastCalledTime) {
    lastCalledTime = performance.now();
    fps = 0;
  } else {
    let delta = (performance.now() - lastCalledTime) / 1000;
    fps = Math.round(1 / delta);
    
    lastCalledTime = performance.now();

    fpsEl.innerText = `${Math.floor(timeTaken)}ms - ${ticksDone - 1} ticks - ${ticksPerSecond} TPS - ${fps}`;
  }
}