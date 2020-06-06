import * as PerfOverlay from './perfOverlay';
import * as BetterMath from './betterMath';
import { registerSW } from './pwa/register';

import { shaders } from './renderer/shaders';

import * as SaveUI from './saveSystem/ui';

// import * as LoadingDisplay from './loadingDisplay';

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

let infoEl, fpsEl, faucetCheckboxEl, scaleSelectEl, cursorSelectEl, materialMenuOpenerEl, materialMenuEl, tileInfoEl, pauseMenuEl, loadOpenEl, saveOpenEl, loadMenuEl, frameLockCheckboxEl, worldFullscreenCheckboxEl;

let baseTile = { material: 'air', rand: 0, age: 0 };

let mousePos = {x: 0, y: 0};
let mouseDrawInterval;
let mouseDrawSize = 1;
let mouseDown = false;

let faucetOn = false;

let materials = ['fire', 'air', 'acid', 'crude_oil', 'water', 'lava', 'concrete', 'gunpowder', 'grass', 'dirt', 'sand', 'stone', 'glass', 'wood', 'wall'];
window.global_materials = materials;

let mouseSelected = 'sand';
let oldMouseSelected = undefined;

let cameraX = 0;
let cameraY = 0;

let worldWidth = 200;
let worldHeight = 200;

let iconCanvas, iconCtx;
let iconTileFactor = 3.2;
let iconTileSize = 9;
let iconImgPixelSize = iconTileFactor * iconTileSize;

let worldFullscreen = true;

let densityLookup = {
  'air': 5,
  
  'acid': 20,
  'crude_oil': 30,
  'water': 50,
  'lava': 100,

  'concrete': 200,
  
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
  'acid': true,
  'concrete': true,

  'air': true
};

let viscosityLookup = {
  'water': 1,
  'acid': 2,
  'crude_oil': 2,
  'lava': 5,
  'concrete': 5
};

let gasLookup = {
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

  {reactants: ['dirt', 'air'], product: 'grass', chance: 0.01, reactantStay: 1},

  {reactants: ['grass', 'fire'], product: 'fire', forced: 0.5, chance: 10},
  {reactants: ['grass', 'lava'], product: 'fire', reactantStay: 1},

  {reactants: ['concrete', 'air'], product: 'stone', chance: 0.02, reactantStay: 1},
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

  reactions.map((r) => {
    r.chance = (r.chance || 100) / 100;
  });
}

function makeMatIcon(mat, el) {
  let iconImgData = iconCtx.getImageData(0, 0, iconTileSize, iconTileSize);
  let iconPixels = iconImgData.data;

  for (let x = 0; x < iconTileSize; x++) {
    for (let y = 0; y < iconTileSize; y++) {
      let off = (x + (y * iconTileSize)) * 4;

      iconPixels[off] = 0;
      iconPixels[off + 1] = 0;
      iconPixels[off + 2] = 0;
      iconPixels[off + 3] = 0;
    }
  }

  iconCtx.putImageData(iconImgData, 0, 0);

  if (!staticLookup[mat]) {
    let n = 5;
    for (let i = 0; i < n; i++) {
      for (var j = 1; j < n - i; j++) {
      
      }

      for (let k = 1; k <= ( 2 * i + 1); k++) {
        let c = shaders[mat]({rand: BetterMath.random(), age: 0.075});

        let off = ((j + k - 2) + ((i + ((iconTileSize - n) / 2)) * iconTileSize)) * 4;
        iconPixels[off] = c.r;
        iconPixels[off + 1] = c.g;
        iconPixels[off + 2] = c.b;
        iconPixels[off + 3] = c.a;
      }
    }
  } else {
    let xStart = Math.round(iconTileSize / 4);
    let xEnd = Math.round(iconTileSize - xStart);
    let ageStart = oldAgeLookup[mat] * 1 || 0;
    let age = Number(ageStart);

    for (let y = 1; y < iconTileSize - 1; y++) {
      age -= ageStart / (iconTileSize - 1);

      for (let x = xStart; x < xEnd; x++) {
        var c = shaders[mat]({rand: BetterMath.random(), age});

        let off = (x + (y * iconTileSize)) * 4;

        iconPixels[off] = c.r;
        iconPixels[off + 1] = c.g;
        iconPixels[off + 2] = c.b;
        iconPixels[off + 3] = c.a;
      }

      if (age !== 0) console.log(y, age);
    }
  }

  let borderColor = shaders[mat]({rand: 1.5, age: 0.075});

  iconCtx.putImageData(iconImgData, 0, 0);
  
  el.className = 'materialIcon';
  el.src = iconCanvas.toDataURL('image/png');

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

      materialMenuOpenerEl.src = this.firstChild.src;

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
  
  let newTiles = Array.from(Array(worldHeight), () => Array.apply(undefined, Array(worldWidth)).map((x) => Object.assign({}, baseTile)));
  
  newTiles = newTiles.map((p, x) => p.map((t, y) => {
    t.rand = BetterMath.random();
    
    //t.x = x;
    //t.y = y;
    
    return t;
  }));
  
  // border
  for (let x = 0; x < worldWidth; x++) {
    newTiles[0][x].material = 'wall';
    newTiles[worldHeight - 1][x].material = 'wall';
  }
  
  for (let y = 0; y < worldHeight; y++) {
    newTiles[y][0].material = 'wall';
    newTiles[y][worldWidth - 1].material = 'wall';
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

function resizeCanvas(load = false) {
  if (!load) scaleFactor = parseFloat(scaleSelectEl.value);
  
  viewportWidth = Math.floor(window.innerWidth / scaleFactor);
  viewportHeight = Math.floor(window.innerHeight / scaleFactor);

  if (load && (worldWidth !== viewportWidth || worldHeight !== viewportHeight)) {
    if (viewportWidth > worldWidth) {
      let sW = window.innerWidth / worldWidth;
      let sH = window.innerHeight / worldHeight;

      scaleFactor = sW > sH ? sW : sH;

      //scaleFactor = parseFloat((scaleFactor + 0.1).toFixed(2));
      return resizeCanvas(true);
    }
  }

  /*if (worldWidth > viewportWidth || worldHeight > viewportHeight) {
    scaleFactor += 2;
    return resizeCanvas();
  }*/

  canvas.width = viewportWidth;
  canvas.height = viewportHeight;
  
  overlayCanvas.width = viewportWidth * scaleFactor;
  overlayCanvas.height = viewportHeight * scaleFactor;
  
  imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  pixels = imgData.data;

  let aPadding = `${Math.floor(scaleFactor * 2)}px`;
  let lPadding = `${Math.floor(scaleFactor * 2) + 70}px`;

  let pauseSize = `calc(100% - ${Math.floor(scaleFactor * 2) * 2}px)`;

  pauseMenuEl.style.padding = aPadding;
  pauseMenuEl.style.width = pauseSize;
  pauseMenuEl.style.height = pauseSize;

  loadMenuEl.style.padding = aPadding;
  loadMenuEl.style.width = pauseSize;
  loadMenuEl.style.height = pauseSize;

  infoEl.style.padding = aPadding;
  infoEl.style.paddingLeft = lPadding;
  infoEl.style.width = `calc(100% - ${aPadding} - ${lPadding})`;

  materialMenuOpenerEl.style.margin = aPadding;

  if (load === false && (worldFullscreen || (viewportWidth > worldWidth || viewportHeight > worldHeight))) initTiles();
}

function mouseTargetCheck(e) {
  let path = event.path || (event.composedPath && event.composedPath());

  return e.target.localName === 'select' || e.target.localName === 'option' || e.target.localName === 'input' || e.target.className.includes('material') || path[1].className.includes('material') || path.some((x) => x.id && x.id.includes('Menu'));
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

let oldMouseActual = {x: 0, y: 0};

function mouseMoveHandler(e) {
  let oldMousePos = Object.assign({}, mousePos);

  mousePos = {x: e.clientX, y: e.clientY};
  
  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  if (mouseTargetCheck(e)) return;

  let actualPosX = Math.floor(mousePos.x / scaleFactor);
  let actualPosY = Math.floor(mousePos.y / scaleFactor);

  let surrounding = Math.floor(mouseDrawSize / 2);
  let evenAdd = mouseDrawSize % 2 === 1 ? 0 : 1;
  
  let left = Math.floor(actualPosX - surrounding + evenAdd) * scaleFactor;
  let top = Math.floor(actualPosY - surrounding + evenAdd) * scaleFactor;
  
  overlayCtx.globalAlpha = 0.8;
  overlayCtx.lineWidth = 2;
  overlayCtx.strokeStyle = 'white';
  
  let size = (surrounding * 2) - evenAdd + 1;
  let oSize = Math.floor(size * scaleFactor);
  
  overlayCtx.beginPath();
  overlayCtx.rect(left, top, oSize, oSize);
  overlayCtx.stroke();  
  
  if (mouseDown) {
    let x1 = oldMouseActual.x;
    let y1 = oldMouseActual.y;

    let x2 = actualPosX;
    let y2 = actualPosY;

    let x = Number(x1);

    let m = (y2 - y1) / (x2 - x1);

    while (x != x2) {
      let y = Math.floor(m * (x - x1) + y1);

      mouseDraw({x, y}, true);

      x += x < x2 ? 1 : -1;
    }
  }

  tileInfoEl.innerText = materialDisplayText(tiles[actualPosY][actualPosX].material);

  oldMouseActual = {x: actualPosX, y: actualPosY};
}

function mouseUpHandler(e) {
  clearInterval(mouseDrawInterval);
  
  mouseDown = false;
  
  if (oldMouseSelected !== undefined) {
    mouseSelected = oldMouseSelected.slice();
    oldMouseSelected = undefined;
  }
}

function mouseDraw(pos = mousePos, already = false) {
  let actualPosX = cameraX + (already ? pos.x : Math.floor(pos.x / scaleFactor));
  let actualPosY = cameraY + (already ? pos.y : Math.floor(pos.y / scaleFactor));
  
  tiles[actualPosY][actualPosX].age = 0;
  
  if (faucetOn && oldMouseSelected === undefined) {
    tiles[actualPosY][actualPosX].material = 'wall';
    tiles[actualPosY][actualPosX].faucet = mouseSelected;
    
    return;
  }
  
  let surrounding = Math.floor(mouseDrawSize / 2);
  let evenAdd = mouseDrawSize % 2 === 1 ? 0 : 1;
  
  // console.log(actualPosX - surrounding + evenAdd, actualPosX + surrounding, (actualPosX + surrounding) - (actualPosX - surrounding + evenAdd));
  
  for (let x = actualPosX - surrounding + evenAdd; x <= actualPosX + surrounding; x++) {
    for (let y = actualPosY - surrounding + evenAdd; y <= actualPosY + surrounding; y++) {
      tiles[y][x].material = mouseSelected;
      tiles[y][x].faucet = undefined;
      tiles[y][x].age = 0;
    }
  }
}


let overlayCanvas, overlayCtx;

window.onload = function() {
  // LoadingDisplay.init();
  // LoadingDisplay.write('Creating canvases...');

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
  iconCanvas.width = iconTileSize;
  iconCanvas.height = iconTileSize;
  iconCanvas.id = 'iconCanvas';
  
  document.body.append(iconCanvas, overlayCanvas, canvas);

  // LoadingDisplay.write('Getting contexts...');
  
  ctx = canvas.getContext('2d');
  overlayCtx = overlayCanvas.getContext('2d');
  iconCtx = iconCanvas.getContext('2d');

  // LoadingDisplay.write('Gathering image data...');
  
  imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  pixels = imgData.data;

  // LoadingDisplay.write('\nInitialising tiles...');

  initTiles();

  // LoadingDisplay.write('\nCompiling reactants...');

  compileReactants();
  
  // LoadingDisplay.write('\nRunning initial update...');

  fpsEl = document.getElementById('fps');

  update();

  // LoadingDisplay.write('\nCreating material picker...');

  materialMenuOpenerEl = document.getElementById('materialMenuOpener');
  materialMenuEl = document.getElementById('materialMenu');

  makeMatMenu();

  // LoadingDisplay.write('Gathering UI elements...');

  scaleSelectEl = document.getElementById('scaleSelect');
  faucetCheckboxEl = document.getElementById('faucetCheckbox');
  cursorSelectEl = document.getElementById('cursorSelect');
  infoEl = document.getElementById('info');
  tileInfoEl = document.getElementById('tileInfo');
  pauseMenuEl = document.getElementById('pauseMenu'); 
  saveOpenEl = document.getElementById('saveOpen');
  loadOpenEl = document.getElementById('loadOpen');
  loadMenuEl = document.getElementById('loadMenu');

  saveOpenEl.onclick = function() {
    SaveUI.saveWorld(tiles);
  };

  loadOpenEl.onclick = function() {
    pauseMenuEl.className = '';

    loadMenuEl.className = loadMenuEl.className === 'show' ? '' : 'show';
  };

  SaveUI.createLoadMenu();  

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

  // LoadingDisplay.write('Initialising dropdowns...');
  
  initScaleSelect();
  initCursorSelect();

  /*let loadingTime = performance.now() - startTime;
  console.log(loadingTime);*/

  // LoadingDisplay.write('Adding event listeners...');
  
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
  
  document.onkeydown = function(e) {
    console.log(e);

    let key = e.key.toLowerCase();
  
    if (key === 'p') {
      if (e.shiftKey) {
        PerfOverlay.cycleThroughTitles();
        return;
      }

      if (PerfOverlay.enabled) {
        PerfOverlay.off();
      } else {
        PerfOverlay.on();
      }

      fpsEl.className = fpsEl.className === 'show' ? '' : 'show';
    }
    
    if (key === 'w') {
      if (cameraY > 0) {
        cameraY--;
      }
    }
    
    if (key === 's') {
      if (cameraY + viewportHeight < worldHeight) {
        cameraY++;
      }
    }
    
    if (key === 'a') {
      if (cameraX > 0) {
        cameraX--;
      }
    }
    
    if (key === 'd') {
      if (cameraX + viewportWidth < worldWidth) {
        cameraX++;
      }
    }
    
    if (key === ' ') {
      paused = !paused;
    }

    if (key === 'escape') {
      if (loadMenuEl.className !== 'show') pauseMenuEl.className = pauseMenuEl.className === 'show' ? '' : 'show';
      loadMenuEl.className = '';

      paused = !paused;
    }

    if (key === 'm') {
      toggleMaterialMenu();
    }
  };

  // LoadingDisplay.write('Initialising Performance Overlay...');
  
  PerfOverlay.init();

  // LoadingDisplay.write('Registering service worker...');

  registerSW();

  // LoadingDisplay.write(`\n\nTotal load time: ${(performance.now() - startTime).toFixed(2)}ms`);

  // LoadingDisplay.finish();
};

let paused = false;

function renderText(x, y, size, color, text, align) {
  ctx.font = `${size}px Roboto`;
  ctx.fillStyle = color;
  ctx.textAlign = align || 'center';
  
  ctx.fillText(text, x, y);
}

function moveTile(originalTile, newTile, oX, oY, nX, nY) {
  let originalMaterial = originalTile.material.slice();
  let originalAge = Number(originalTile.age);
  //let originalReactionUpdated = Boolean(originalTile.reactionUpdated);
  
  originalTile.material = newTile.material;
  newTile.material = originalMaterial;
  
  typeUpdatedMap[oY][oX] = true;
  typeUpdatedMap[nY][nX] = true;

  //newTile.typeUpdated = true;
  //originalTile.typeUpdated = true;
  
  originalTile.age = newTile.age;
  newTile.age = originalAge;
  
  /*originalTile.reactionUpdated = newTile.reactionUpdated;
  newTile.reactionUpdated = originalReactionUpdated;*/
}

let lastStartTime;
let lastSecond = performance.now();
let recentAge = 0;
let timeFactor = 0.0125;

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
    //recentAge = 0;
  }

  for (var ticksDone = 1; ticksDone < recentAge / timeFactor; ticksDone++) {
    for (let x = cameraX - viewportSimRadius; x < cameraX + viewportWidth + viewportSimRadius; x++) {
      for (let y = cameraY - viewportSimRadius; y < cameraY + viewportHeight + viewportSimRadius; y++) {
        //if (x < 0 || y < 0) continue;
        if ((x < 0 || x >= worldWidth) || (y < 0 || y >= worldHeight)) continue;
        
        // let realDeltaTime = deltaTime / Math.floor(recentAge / factor);

        let t;
        try {
          t = tiles[y][x];
        } catch (e) {
          console.error(e);
          console.log(x, y);
          console.log(viewportWidth, viewportHeight);
          console.log(worldWidth, worldHeight);
        }
        
        if (!paused && ticksDone === 1) t.age += deltaTime;
        
        let aboveTile = y > 0 ? tiles[y - 1][x] || {material: 'nonExistant', typeUpdated: false, reactionUpdated: false} : {material: 'nonExistant', typeUpdated: false, reactionUpdated: false};
        let belowTile = y < worldHeight - 1 ? tiles[y + 1][x] || {material: 'nonExistant', typeUpdated: false, reactionUpdated: false} : {material: 'nonExistant', typeUpdated: false, reactionUpdated: false};
        let sameLeftTile = tiles[y][x - 1] || {material: 'nonExistant', typeUpdated: false, reactionUpdated: false};
        let sameRightTile = tiles[y][x + 1] || {material: 'nonExistant', typeUpdated: false, reactionUpdated: false};
        
        let adjacentNeighbours = [aboveTile, belowTile, sameLeftTile, sameRightTile];
        
        let adjSameCount = 0;
        let airCount = 0;
        let nonExistantCount = 0;
        for (let neighbour of adjacentNeighbours) {
          if (neighbour.material === t.material) adjSameCount++;
          if (neighbour.material === 'air') airCount++;
          else if (neighbour.material === 'nonExistant') nonExistantCount++;
        }
        
        if (oldAgeLookup[t.material] !== false) {
          if (t.age > oldAgeLookup[t.material]) {
            t.material = 'air';
            t.age = 0;
          }
        }
        
        if (t.faucet !== undefined) {
          belowTile.material = t.faucet.slice();
          belowTile.age = 0;
        }
        
        let c = shaders[t.material](t);
        
        let randIncrease = liquidLookup[t.material] && t.material !== 'air' ? ((BetterMath.random() * 2 - 1) / 20) : 0;
        randIncrease = t.material === 'fire' ? ((BetterMath.random() * 2 - 1) / 5) : randIncrease;
        
        if (!paused) t.rand += randIncrease;
        
        t.rand = t.rand > 1 ? 1 : t.rand;
        t.rand = t.rand < 0 ? 0 : t.rand;
        
        if (t.material !== 'wall' && adjSameCount + airCount + nonExistantCount !== 4) {
          let orig = Number(t.rand);
          t.rand = 2;
          
          c = shaders[t.material](t);
          
          t.rand = orig;
        }
        
        if (!paused && adjSameCount !== 4) {
          if (!staticLookup[t.material]) {
            let bottom = y === worldHeight - 1;
            
            if (!bottom && !typeUpdatedMap[y][x]) {
              if (liquidLookup[belowTile.material] && densityLookup[belowTile.material] < densityLookup[t.material]) {
                moveTile(t, belowTile, x, y, x, y + 1);
              } else {
                let belowLeftTile = y < worldHeight - 1 ? tiles[y + 1][x - 1] || {material: 'nonExistant', typeUpdated: false, reactionUpdated: false} : {material: 'nonExistant', typeUpdated: false, reactionUpdated: false};
                let belowRightTile = y < worldHeight - 1 ? tiles[y + 1][x + 1] || {material: 'nonExistant', typeUpdated: false, reactionUpdated: false} : {material: 'nonExistant', typeUpdated: false, reactionUpdated: false};
                
                let sameLeftAvaliable = densityLookup[sameLeftTile.material] < densityLookup[t.material];
                let sameRightAvaliable = densityLookup[sameRightTile.material] < densityLookup[t.material];

                let belowLeftAvaliable = sameLeftAvaliable && liquidLookup[belowLeftTile.material] && densityLookup[belowLeftTile.material] < densityLookup[t.material];
                let belowRightAvaliable = sameRightAvaliable && liquidLookup[belowRightTile.material] && densityLookup[belowRightTile.material] < densityLookup[t.material];
                
                if (belowLeftAvaliable && belowRightAvaliable) {
                  if (BetterMath.random() >= 0.5) {
                    moveTile(t, belowRightTile, x, y, x + 1, y + 1);
                  } else {
                    moveTile(t, belowLeftTile, x, y, x - 1, y + 1);
                  }
                } else {
                  if (belowLeftAvaliable) {
                    moveTile(t, belowLeftTile, x, y, x - 1, y + 1);
                  }
                  
                  if (belowRightAvaliable) {
                    moveTile(t, belowRightTile, x, y, x + 1, y + 1);
                  }
                }
                
                if (liquidLookup[t.material] && !belowLeftAvaliable && !belowRightAvaliable && BetterMath.random() > (viscosityLookup[t.material] / 100)) {
                  if (sameLeftAvaliable && sameRightAvaliable) {
                    if (BetterMath.random() >= 0.5) {
                      moveTile(t, sameRightTile, x, y, x + 1, y);
                    } else {
                      moveTile(t, sameLeftTile, x, y, x - 1, y);
                    }
                  } else {
                    if (sameLeftAvaliable) {
                      moveTile(t, sameLeftTile, x, y, x - 1, y);
                    }
                    
                    if (sameRightAvaliable) {
                      moveTile(t, sameRightTile, x, y, x + 1, y);
                    }
                  }
                }
              }
            }
          }
          
          for (let r of reactions) {
            if (!r.reactants.includes(t.material)) continue;
            
            let i = -1;
            for (let neighbouringTile of adjacentNeighbours) {
              i++;

              if (neighbouringTile.material === t.material || neighbouringTile.reactionUpdated) continue;
              
              if (r.reactants.includes(neighbouringTile.material)) {
                if (BetterMath.random() > r.chance) continue;
                
                let product = r.product.slice();
                
                let thisIndex = r.reactants.indexOf(t.material);
                
                if (r.reactantStay !== thisIndex) {
                  t.material = product;
                  t.forced = undefined;
                  reactionUpdatedMap[y][x] = true;
                  t.age = 0;
                }
                
                if (r.reactantStay !== (thisIndex === 0 ? 1 : 0)) {
                  neighbouringTile.material = product;
                  neighbouringTile.forced = undefined;

                  let nX = x;
                  let nY = y;

                  switch (i) {
                    case 0:
                      y--;
                      break;
                    case 1:
                      y++;
                      break;
                    case 2:
                      x--;
                      break;
                    case 3:
                      x++;
                      break;
                  }

                  reactionUpdatedMap[nY][nX] = true;

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
          
          if (gasLookup[t.material]) {
            if (densityLookup[aboveTile.material] < densityLookup[t.material]) {
              moveTile(t, aboveTile, x, y, x, y - 1);
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
          
          c = shaders[t.material](t);
        }
        
        if ((!paused || t.age === 0) && ticksDone === (recentAge / timeFactor | 0) && (x >= cameraX && x < cameraX + viewportWidth) && (y >= cameraY && y < cameraY + viewportHeight)) {
          let off = ((x - cameraX) + ((y - cameraY) * viewportWidth)) * 4;
          
          pixels[off] = c.r;
          pixels[off + 1] = c.g;
          pixels[off + 2] = c.b;
          pixels[off + 3] = c.a;
        }
      }
    }

    typeUpdatedMap = ar(worldWidth, worldHeight, false);
    reactionUpdatedMap = ar(worldWidth, worldHeight, false);

    /*for (let x = 0; x < worldWidth; x++) {
      for (let y = 0; y < worldHeight; y++) {
        tiles[y][x].typeUpdated = false;
        tiles[y][x].reactionUpdated = false;
      }
    }*/
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

  if (fpsEl.className !== 'show') return;

  let timeTaken = performance.now() - startTime;
  
  if (!lastCalledTime) {
    lastCalledTime = performance.now();
    fps = 0;
  } else {
    let delta = (performance.now() - lastCalledTime) / 1000;
    fps = Math.round(1 / delta);
    
    lastCalledTime = performance.now();
    
    fpsArr.unshift(fps);

    if (fpsArr.length > 1000) fpsArr.pop();

    fpsEl.innerText = `FPS: ${(fpsArr.reduce((p, c) => p + c, 0) / fpsArr.length).toFixed(0)} avg, ${Math.max(...fpsArr)} max, ${Math.min(...fpsArr)} min
Frame took ${Math.floor(timeTaken)}ms

${ticksDone - 1} ticks this frame
${ticksPerSecond} TPS (Aim: ${1 / timeFactor})

Memory: ${(window.performance.memory.usedJSHeapSize / 1000000).toFixed(2)}MB/${(window.performance.memory.totalJSHeapSize / 1000000).toFixed(2)}MB`;
  }

  switch (PerfOverlay.currentTitle) {
    case 'ticks per second':
      PerfOverlay.addValue(ticksDone - 1);
      break;
    case 'memory usage':
      PerfOverlay.addValue(window.performance.memory.usedJSHeapSize / 1000000);
      break;
    case 'frames per second':
      PerfOverlay.addValue(fps);
      break;
    case 'frame time':
      PerfOverlay.addValue(timeTaken);
      break;
  }
}

let reactionUpdatedMap = ar(worldWidth, worldHeight, false);
let typeUpdatedMap = ar(worldWidth, worldHeight, false);

let fpsArr = [];

function ar(x,y,cont) {
  return new Array(y).fill(0).map(()=>Array(x).fill(cont));
}

window.overrideTiles = function(t, w, h) {
  tiles = t.slice();
  worldWidth = Number(w);
  worldHeight = Number(h);

  cameraX = 0;
  cameraY = 0;

  resizeCanvas(true);
};

window.overridePause = function(p) {
  paused = p
};

window.getTiles = function() { return tiles; };