import * as PerfOverlay from './perfOverlay';
import { addTime } from './exportedVars';
import { betterSinAngle, betterSinRadians } from './sinTaylor';
import { registerSW } from './pwa/register';

export let canvas, ctx;
export let fps = 0;
let lastCalledTime;

let frame = 0;

let useRequestAnim = false;

let tiles = [];

let scaleFactor = 14;

let viewportWidth = Math.floor(window.innerWidth / scaleFactor);
let viewportHeight = Math.floor(window.innerHeight / scaleFactor);
let viewportSimRadius = 10;

let imgData;
let pixels;

let infoEl, fpsEl, faucetCheckboxEl, scaleSelectEl, cursorSelectEl, materialMenuOpenerEl, materialMenuEl, frameLockCheckboxEl, worldFullscreenCheckboxEl;

let baseTile = { material: 'air', typeUpdated: false, reactionUpdated: false, rand: 0, age: 0 };

let mousePos = {x: 0, y: 0};
let mouseDrawInterval;
let mouseDrawSize = 1;
let mouseDown = false;

let faucetOn = false;

let materials = ['fire', 'air', 'acid', 'crude_oil', 'water', 'lava', 'gunpowder', 'grass', 'dirt', 'sand', 'stone', 'glass', 'wood', 'wall']; //['water', 'crude_oil', 'lava', 'acid', 'sand', 'dirt', 'wood', 'grass', 'gunpowder', 'glass', 'stone', 'wall', 'air', 'fire'];
let mouseSelected = 'sand';
let oldMouseSelected = undefined;

let cameraX = 0;
let cameraY = 0;

let worldWidth = 200;
let worldHeight = 200;

let iconCanvas, iconCtx, iconImgData, iconPixels;
let iconTileFactor = 3.5;
let iconTileSize = 9;
let iconCanvasPixelSize = iconTileSize;
let iconImgPixelSize = iconTileFactor * iconTileSize;

let worldFullscreen = true;

let materialColors = {
  'sand': (t) => ({ r: 250 - (t.rand * 40), g: 200 - (t.rand * 30), b: 55, a: 255 }),
  'water': (t) => ({ r: 60 - (t.rand * 40), g: 190 - (t.rand * 20), b: 230, a: 200 }),
  'crude_oil': (t) => ({ r: 100 - (t.rand * 20), g: 100 - (t.rand * 20), b: 100 - (t.rand * 20), a: 200 }),
  'wall': (t) => ({ r: 120 - (t.rand * 45), g: 120 - (t.rand * 40), b: 120 - (t.rand * 35) + (t.faucet === undefined ? 0 : 150), a: 255 }),
  'lava': (t) => ({ r: 230, g: 125 - (t.rand * 20), b: 10 + (t.rand * 30), a: 250 }),
  'stone': (t) => ({ r: 200 - (t.rand * 40), g: 200 - (t.rand * 40), b: 200 - (t.rand * 40), a: 255 }),
  'glass': (t) => ({ r: 250 - (t.rand * 20), g: 250 - (t.rand * 20), b: 250 - (t.rand * 20), a: 230 }),
  'air': (t) => ({ r: 0, g: 0, b: 20 / (t.faucet === undefined ? 0 : 0), a: 20 - (0 / t.age) }), // you may be wondering why age is being used here, and it's because if t.age is used in only one function (fire) then JIT breaks it in browsers (at least in chromium)
  'fire': (t) => ({ r: 255, g: 65 + (t.rand * 20), b: 25 + (t.rand * 30), a: (betterSinRadians(t.age * 22) + 0.3) * 255 }),
  'acid': (t) => ({ r: 80 - (t.rand * 70), g: 225, b: 80 - (t.rand * 65), a: 200}),
  'gunpowder': (t) => ({r: 50 - (t.rand * 40), g: 50 - (t.rand * 40), b: 50 - (t.rand * 40), a: 255}),
  'dirt': (t) => ({r: 180 - (t.rand * 60), g: 80 - (t.rand * 40), b: 10, a: 255}),
  'grass': (t) => ({r: 40, g: 230 - (t.rand * 60), b: 50, a: 255}),
  'wood': (t) => ({r: 240 - (t.rand * 40), g: 120 - (t.rand * 20), b: 20, a: 255})
};

let densityLookup = {
  'air': 5,
  
  'acid': 20,
  'crude_oil': 30,
  'water': 50,
  'lava': 100,
  
  'gunpowder': 300,

  'grass': 399,
  'dirt': 400,
  'sand': 500,
  'stone': 700,
  'glass': 800,
  
  'wood': 9998,
  'wall': 9999,
  
  'fire': 200
};

let staticLookup = {
  'fire': true,
  'air': true,
  'wall': true,
  'wood': true
};

let liquidLookup = {
  'water': true,
  'lava': true,
  'crude_oil': true,
  'acid': true
};

let viscosityLookup = {
  'water': 1,
  'acid': 2,
  'crude_oil': 2,
  'lava': 5
};

let floatLookup = {
  'fire': true
};

let oldAgeLookup = {
  'fire': 0.15
};

let reactions = [
  {reactants: ['water', 'lava'], product: 'stone'},
  {reactants: ['sand', 'lava'], product: 'glass'},

  {reactants: ['crude_oil', 'fire'], product: 'fire', forced: 5, chance: 0.3},
  {reactants: ['crude_oil', 'lava'], product: 'fire', reactantStay: 1},

  {reactants: ['water', 'fire'], product: 'air'},

  {reactants: ['acid', '*:not(wall,air)'], product: 'air', chance: 50},

  {reactants: ['gunpowder', 'fire'], product: 'fire', forced: 0.1, chance: 50},
  {reactants: ['gunpowder', 'lava'], product: 'fire', reactantStay: 1},

  {reactants: ['wood', 'fire'], product: 'fire', forced: 1.5, chance: 0.4},
  {reactants: ['wood', 'lava'], product: 'fire', reactantStay: 1},

  {reactants: ['dirt', 'air'], product: 'grass', chance: 0.008, reactantStay: 1}
];

function compileReactants() {
  let i = 0;
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

      reactions.splice(i, 1);
    }

    i++;
  }

  console.log(reactions);
}

function makeMatIcon(mat, el) {
  let n = 5;
  for (var i = 0; i < n; i++) {
    for (var j = 1; j < n - i; j++) {
      
    }

    for (var k = 1; k <= ( 2 *i + 1); k++) {
      let c = materialColors[mat]({rand: Math.random(), age: 0.075});

      let off = ((j + k - 2) + ((i + ((iconCanvasPixelSize - n) / 2)) * iconCanvasPixelSize)) * 4;
      iconPixels[off] = c.r;
      iconPixels[off + 1] = c.g;
      iconPixels[off + 2] = c.b;
      iconPixels[off + 3] = c.a;
    }
  }

  let borderColor = materialColors[mat]({rand: 1.5, age: 0.075});
  let backColor = materialColors[mat]({rand: 0.5, age: 0.075});

  iconCtx.putImageData(iconImgData, 0, 0);
  
  el.className = 'materialIcon';
  el.src = iconCanvas.toDataURL('image/png');

  let backgroundChoice = backColor.r * 0.299 + backColor.g * 0.587 + backColor.b * 0.114 > 186;

  el.style.backgroundColor = backgroundChoice ? 'rgb(20, 20, 20)' : 'rgb(250, 250, 250)';
  el.style.borderColor = backgroundChoice ? 'rgb(100, 100, 100)' : 'rgb(200, 200, 200)';

  if (el.parentNode) { el.parentNode.style.borderColor = `rgb(${borderColor.r}, ${borderColor.g}, ${borderColor.b})`; }
  
  el.style.width = `${iconImgPixelSize - 5}px`;
  el.style.height = `${iconImgPixelSize - 5}px`;
}

function materialDisplayText(mat) {
  let d = mat.toString().replace('_', ' ');
  return d[0].toUpperCase() + d.substring(1);
}

function makeMatMenu() {
  let parent = document.getElementById('materialMenu');

  for (let mat of materials) {
    let container = document.createElement('div');
    container.className = 'materialOption';

    let el = document.createElement('img');

    container.appendChild(el);

    let text = document.createElement('span');
    text.innerText = materialDisplayText(mat);

    container.appendChild(text);

    container.onclick = function(e) {
      let chosenMat = this.innerText.toLowerCase().replace(' ', '_');

      mouseSelected = chosenMat;
      makeMatIcon(mouseSelected, materialMenuOpenerEl);

      materialMenuEl.className = '';
    };

    parent.appendChild(container);

    makeMatIcon(mat, el);
  }

  makeMatIcon(mouseSelected, materialMenuOpenerEl);

  materialMenuOpenerEl.onclick = toggleMaterialMenu;
}

function toggleMaterialMenu() {
  materialMenuEl.className = materialMenuEl.className === 'show' ? '' : 'show';
}

function initTiles() {
  worldWidth = viewportWidth;
  worldHeight = viewportHeight;
  
  let newTiles = Array.from(Array(worldWidth), () => Array.apply(undefined, Array(worldHeight)).map((x) => Object.assign({}, baseTile)));
  
  newTiles = newTiles.map((p, x) => p.map((t, y) => {
    t.rand = Math.random();
    
    t.x = x;
    t.y = y;
    
    return t;
  }));
  
  // border
  for (let x = 0; x < worldWidth; x++) {
    newTiles[x][0].material = 'wall';
    newTiles[x][worldHeight - 1].material = 'wall';
  }
  
  for (let y = 0; y < worldHeight; y++) {
    newTiles[0][y].material = 'wall';
    newTiles[worldWidth - 1][y].material = 'wall';
  }
  
  tiles = newTiles;
}

function initDropdown(options, parent, toSelect) {
  options.forEach((option) => {
    let el = document.createElement('option');
    el.setAttribute('value', option);
    
    if (option === toSelect) { el.setAttribute('selected', true); }

    el.innerText = materialDisplayText(option);
    
    parent.appendChild(el);
  });
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
  
  viewportWidth = Math.floor(window.innerWidth / scaleFactor);
  viewportHeight = Math.floor(window.innerHeight / scaleFactor);
  
  canvas.width = viewportWidth;
  canvas.height = viewportHeight;
  
  overlayCanvas.width = viewportWidth * scaleFactor;
  overlayCanvas.height = viewportHeight * scaleFactor;
  
  imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  pixels = imgData.data;

  let aPadding = `${Math.floor(scaleFactor * 1.8)}px`;
  let lPadding = `${Math.floor(scaleFactor * 1.8) + 55}px`;

  infoEl.style.padding = aPadding;
  infoEl.style.paddingLeft = lPadding;
  infoEl.style.width = `calc(100% - ${aPadding} - ${lPadding})`;

  materialMenuOpenerEl.style.margin = aPadding;

  if (worldFullscreen || (viewportWidth > worldWidth || viewportHeight > worldHeight)) initTiles();
}

function mouseTargetCheck(e) {
  return e.target.localName === 'select' || e.target.localName === 'option' || e.target.localName === 'input' || e.target.className.includes('material') || e.path[1].className.includes('material');
}

function mouseDownHandler(e) {
  if (mouseTargetCheck(e)) return;

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
  
  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  if (mouseTargetCheck(e)) return;

  let actualPosX = Math.floor(mousePos.x / scaleFactor);
  let actualPosY = Math.floor(mousePos.y / scaleFactor);
  
  let surrounding = Math.floor(mouseDrawSize / 2);
  let evenAdd = mouseDrawSize % 2 === 1 ? 0 : 1;
  
  let left = Math.floor(actualPosX - surrounding + evenAdd) * scaleFactor;
  let top = Math.floor(actualPosY - surrounding + evenAdd) * scaleFactor;
  
  overlayCtx.globalAlpha = 0.9;
  overlayCtx.lineWidth = 2;
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
  let actualPosX = cameraX + Math.floor(pos.x / scaleFactor);
  let actualPosY = cameraY + Math.floor(pos.y / scaleFactor);
  
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
  canvas.width = viewportWidth;
  canvas.height = viewportHeight;
  canvas.id = 'sandbox';
  
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  
  overlayCanvas = document.createElement('canvas');
  overlayCanvas.width = viewportWidth * scaleFactor;
  overlayCanvas.height = viewportHeight * scaleFactor;
  overlayCanvas.id = 'overlay';
  
  overlayCanvas.style.width = '100%';
  overlayCanvas.style.height = '100%';

  iconCanvas = document.createElement('canvas');
  iconCanvas.width = iconCanvasPixelSize;
  iconCanvas.height = iconCanvasPixelSize;
  iconCanvas.id = 'iconCanvas';
  
  document.body.prepend(iconCanvas);
  document.body.prepend(overlayCanvas);
  document.body.prepend(canvas);
  
  ctx = canvas.getContext('2d');
  overlayCtx = overlayCanvas.getContext('2d');
  iconCtx = iconCanvas.getContext('2d');
  
  imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  pixels = imgData.data;

  iconImgData = iconCtx.getImageData(0, 0, iconCanvasPixelSize, iconCanvasPixelSize);
  iconPixels = iconImgData.data;

  materialMenuOpenerEl = document.getElementById('materialMenuOpener');
  materialMenuEl = document.getElementById('materialMenu');

  initTiles();
  compileReactants();
  
  update();

  makeMatMenu();
  
  fpsEl = document.getElementById('fps');
  
  scaleSelectEl = document.getElementById('scaleSelect');
  faucetCheckboxEl = document.getElementById('faucetCheckbox');
  cursorSelectEl = document.getElementById('cursorSelect');
  infoEl = document.getElementById('info');
  
  /*frameLockCheckboxEl = document.getElementById('framelockCheckbox');
  frameLockCheckboxEl.onchange = function(e) {
    useRequestAnim = frameLockCheckboxEl.checked;
  };*/
  
  faucetCheckboxEl.onchange = function(e) {
    faucetOn = faucetCheckboxEl.checked;
  };

  /*worldFullscreenCheckboxEl = document.getElementById('worldFullscreenCheckbox');
  worldFullscreenCheckboxEl.onchange = function(e) {
    worldFullscreen = worldFullscreenCheckboxEl.checked;
  };*/
  
  initScaleSelect();
  initCursorSelect();

  let loadingTime = performance.now() - startTime;
  console.log(loadingTime);
  
  document.onmousedown = function(e) { mouseDownHandler(e); };
  document.onmousemove = function(e) { mouseMoveHandler(e); };
  document.onmouseup = function(e) { mouseUpHandler(e); };
  
  document.ontouchstart = function(e) { mouseDownHandler(e.touches[0]); };
  document.ontouchmove = function(e) { mouseMoveHandler(e.touches[0]); };
  document.ontouchend = function(e) { mouseUpHandler(e.touches[0]); };
  
  /*document.oncontextmenu = function(e) {
    e.preventDefault();
    return false;
  }*/
  
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
    
    if (e.key === 'w') {
      if (cameraY > 0) {
        cameraY--;
      }
    }
    
    if (e.key === 's') {
      if (cameraY + viewportHeight < worldHeight) {
        cameraY++;
      }
    }
    
    if (e.key === 'a') {
      if (cameraX > 0) {
        cameraX--;
      }
    }
    
    if (e.key === 'd') {
      if (cameraX + viewportWidth < worldWidth) {
        cameraX++;
      }
    }
    
    if (e.key === ' ') {
      paused = !paused;
    }

    if (e.key === 'h') {
      infoEl.style.opacity = (infoEl.style.opacity || '0.6') === '0.6' ? 0 : 0.6;
    }

    if (e.key === 'm') {
      toggleMaterialMenu();
    }
  };
  
  PerfOverlay.init();

  registerSW();
};

let paused = false;

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
let timeFactor = 0.01;
let originalTimeFactor = Number(timeFactor);

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
  
  if (recentAge / timeFactor > 3) {
    recentAge = 0;
  }
  
  for (var ticksDone = 1; ticksDone < recentAge / timeFactor; ticksDone++) {
    for (let x = cameraX - viewportSimRadius; x < cameraX + viewportWidth + viewportSimRadius; x++) {
      for (let y = cameraY - viewportSimRadius; y < cameraY + viewportHeight + viewportSimRadius; y++) {
        //if (x < 0 || y < 0) continue;
        if ((x < 0 || x >= worldWidth) || (y < 0 || y >= worldHeight)) continue;
        
        // let realDeltaTime = deltaTime / Math.floor(recentAge / factor);
        
        let t = tiles[x][y];
        
        if (!paused && ticksDone === 1) t.age += deltaTime;
        
        let aboveTile = tiles[x][y - 1] || {material: 'nonExistant', typeUpdated: false, reactionUpdated: false};
        let belowTile = tiles[x][y + 1] || {material: 'nonExistant', typeUpdated: false, reactionUpdated: false};
        let sameLeftTile = x <= 0 ? {material: 'nonExistant', typeUpdated: false, reactionUpdated: false} : tiles[x - 1][y];
        let sameRightTile = x >= worldWidth - 1 ? {material: 'nonExistant', typeUpdated: false, reactionUpdated: false} : tiles[x + 1][y];
        
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
        
        if (!paused) t.rand += randIncrease;
        
        t.rand = t.rand > 1 ? 1 : t.rand;
        t.rand = t.rand < 0 ? 0 : t.rand;
        
        if (t.material !== 'wall' && adjSameCount + airCount + nonExistantCount !== 4) {
          let orig = Number(t.rand);
          t.rand = 2;
          
          c = materialColors[t.material](t);
          
          t.rand = orig;
        }
        
        if (!paused && adjSameCount !== 4) {
          if (!staticLookup[t.material]) {
            let bottom = y === worldHeight - 1;
            
            if (!bottom && !t.typeUpdated) {
              if (densityLookup[belowTile.material] < densityLookup[t.material]) {
                moveTile(t, belowTile);
              } else {
                let belowLeftTile = x <= 0 ? {material: 'nonExistant', typeUpdated: false, reactionUpdated: false} : tiles[x - 1][y + 1];
                let belowRightTile = x >= worldWidth - 1 ? {material: 'nonExistant', typeUpdated: false, reactionUpdated: false} : tiles[x + 1][y + 1];
                
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
                
                if (liquidLookup[t.material] && !belowLeftAvaliable && !belowRightAvaliable && Math.random() > (viscosityLookup[t.material] / 100)) {
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
                
                let thisIndex = r.reactants.indexOf(t.material);
                
                if (r.reactantStay !== thisIndex) {
                  t.material = product;
                  t.reactionUpdated = true;
                  t.age = 0;
                }
                
                if (r.reactantStay !== (thisIndex === 0 ? 1 : 0)) {
                  neighbouringTile.material = product;
                  neighbouringTile.reactionUpdated = true;
                  neighbouringTile.age = 0;
                }
                
                
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
        
        if (!paused && t.forced !== undefined) {
          t.age = 0;
          t.material = t.forced[0];
          if (ticksDone === 1) t.forced[1] -= deltaTime;
          
          if (t.forced[1] <= 0) {
            t.forced = undefined;
            delete t.forced;
          }
          
          c = materialColors[t.material](t);
        }
        
        if ((!paused || t.age === 0) && ticksDone === Math.floor(recentAge / timeFactor) && (x >= cameraX && x < cameraX + viewportWidth) && (y >= cameraY && y < cameraY + viewportHeight)) {
          let off = ((x - cameraX) + ((y - cameraY) * viewportWidth)) * 4;
          
          pixels[off] = c.r;
          pixels[off + 1] = c.g;
          pixels[off + 2] = c.b;
          pixels[off + 3] = c.a;
        }
      }
    }

    for (let x = 0; x < worldWidth; x++) {
      for (let y = 0; y < worldHeight; y++) {
        tiles[x][y].typeUpdated = false;
        tiles[x][y].reactionUpdated = false;
      }
    }
  }
  
  recentAge %= timeFactor;
  
  ctx.putImageData(imgData, 0, 0);
  
  frame++;
  
  if (useRequestAnim) {
    requestAnimationFrame(update);
  } else {
    setTimeout(update, 0);
  }

  ticksTotal += ticksDone - 1;

  if (performance.now() - lastSecond > 1000) {
    let nowSec = performance.now()
    lastSecond = nowSec;
    
    ticksPerSecond = ticksTotal;
    ticksTotal = 0;
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
    
    fpsEl.innerText = `${Math.floor(timeTaken)}ms - ${ticksDone - 1} ticks - ${ticksPerSecond} TPS - ${fps} fps`;
  }
}