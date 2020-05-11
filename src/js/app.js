export let canvas, ctx;
export let fps = 0;
let lastCalledTime;
let fpsArr = [];

let frame = 0;

let useRequestAnim = false;

let tiles = [];

let scaleFactor = 10;

let sizeWidth = Math.floor(window.innerWidth / scaleFactor);
let sizeHeight = Math.floor(window.innerHeight / scaleFactor);

let imgData;
let pixels;

let fpsEl, dbgEl, materialSelectEl, scaleSelectEl, frameLockCheckboxEl;

let baseTile = { material: 'air', updated: false, rand: 0 };

let mousePos = {x: 0, y: 0};
let mouseDrawInterval;
let mouseDown = false;

let faucetPos = {x: 0, y: 0};
let faucetOn = false;

let materials = ['water', 'oil', 'lava', 'sand', 'glass', 'stone', 'wall', 'air'];
let mouseSelected = 'water';

let materialColors = {
  'sand': function (t) { return { r: 250 - (t.rand * 40), g: 201 - (t.rand * 30), b: 55, a: 255 } },
  'water': function (t) { return { r: 60 - (t.rand * 40), g: 190 - (t.rand * 20), b: 230, a: 150 } },
  'oil': function (t) { return { r: 100 - (t.rand * 20), g: 100 - (t.rand * 20), b: 100 - (t.rand * 20), a: 150 } },
  'wall': function (t) { return { r: 120 - (t.rand * 45), g: 120 - (t.rand * 40), b: 120 - (t.rand * 35), a: 255 } },
  'lava': function (t) { return { r: 230, g: 125 - (t.rand * 20), b: 10 + (t.rand * 30), a: 150 } },
  'stone': function (t) { return { r: 200 - (t.rand * 40), g: 200 - (t.rand * 40), b: 200 - (t.rand * 40), a: 255 } },
  'glass': function (t) { return { r: 250 - (t.rand * 20), g: 250 - (t.rand * 20), b: 250 - (t.rand * 20), a: 230 } },
  'air': function (t) { return { r: 0, g: 0, b: 0, a: 0 } }
};

let densityLookup = {
  'sand': 500,
  'glass': 800,
  'wall': 9999,
  'stone': 700,
  
  'air': 1,
  
  'water': 50,
  'oil': 30,
  'lava': 100
};

let staticLookup = {
  'water': false,
  'oil': false,
  'lava': false,
  
  'sand': false,
  'stone': false,
  'glass': false,
  
  'air': true,
  'wall': true
};

let liquidLookup = {
  'water': true,
  'oil': true,
  'lava': true,
  
  'sand': false,
  'stone': false,
  'wall': false,
  'glass': false,
  
  'air': false
};

let reactions = [
  {reactants: ['water', 'lava'], product: 'stone'},
  {reactants: ['sand', 'lava'], product: 'glass'},
  {reactants: ['oil', 'lava'], product: 'air'}
];

function initTiles() {
  tiles = Array.from(Array(sizeWidth), () => Array.apply(undefined, Array(sizeHeight)).map((x) => Object. assign({}, baseTile)));
  
  tiles = tiles.map((x) => x.map((t) => { t.rand = Math.random(); return t; }));
  
  // border
  for (let x = 0; x < sizeWidth; x++) {
    tiles[x][0].material = 'wall';
    tiles[x][sizeHeight - 1].material = 'wall';
  }
  
  for (let y = 0; y < sizeHeight; y++) {
    tiles[0][y].material = 'wall';
    tiles[sizeWidth - 1][y].material = 'wall';
  }
}

function initDropdown(options, parent, toSelect) {
  options.forEach((option) => {
    let el = document.createElement('option');
    el.setAttribute('value', option);

    if (option === toSelect) { el.setAttribute('selected', true); }

    el.innerText = option;
    
    parent.appendChild(el);
  });
}

function initMaterialSelect() {
  initDropdown(materials, materialSelectEl, mouseSelected);
  
  materialSelectEl.onchange = function(e) {
    mouseSelected = materialSelectEl.value;
  };
}

function initScaleSelect() {
  initDropdown([2, 4, 6, 8, 10, 12, 14, 16, 18, 20], scaleSelectEl, scaleFactor);

  scaleSelectEl.onchange = function(e) {
    scaleFactor = parseFloat(scaleSelectEl.value);

    sizeWidth = Math.floor(window.innerWidth / scaleFactor);
    sizeHeight = Math.floor(window.innerHeight / scaleFactor);

    canvas.width = sizeWidth;
    canvas.height = sizeHeight;

    imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    pixels = imgData.data;

    initTiles();
  };
}

function mouseDownHandler(e) {
  if (e.target.id.includes('Select')) return;
  
  mousePos = {x: e.clientX, y: e.clientY};
  
  mouseDraw();
  
  mouseDrawInterval = setInterval(mouseDraw, 1);
  
  mouseDown = true;
}

function mouseMoveHandler(e) {
  mousePos = {x: e.clientX, y: e.clientY};
  
  if (mouseDown) mouseDraw();
}

function mouseUpHandler(e) {
  clearInterval(mouseDrawInterval);
  
  mouseDown = false;
}

window.onload = function() {
  canvas = document.createElement('canvas');
  canvas.width = sizeWidth;
  canvas.height = sizeHeight;
  canvas.id = 'sandbox';
  
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  
  document.body.prepend(canvas);
  
  ctx = canvas.getContext('2d');
  
  imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  pixels = imgData.data;
  
  fpsEl = document.getElementById('fps');
  dbgEl = document.getElementById('dbg');

  materialSelectEl = document.getElementById('materialSelect');
  scaleSelectEl = document.getElementById('scaleSelect');
  frameLockCheckboxEl = document.getElementById('framelockCheckbox');

  frameLockCheckboxEl.onchange = function(e) {
    useRequestAnim = frameLockCheckboxEl.checked;
  };

  initScaleSelect();
  initMaterialSelect();
  
  dbgEl.innerText = `${sizeWidth}x${sizeHeight} - ${sizeWidth * sizeHeight}`;

  initTiles();
  
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
  
  document.onkeypress = function(e) {
    if (e.key === ' ') {
      faucetPos = mousePos;
      faucetOn = !faucetOn;
    }
  };
};

function mouseDraw(pos = mousePos) {
  let actualPosX = Math.floor(pos.x / scaleFactor);
  let actualPosY = Math.floor(pos.y / scaleFactor);
  
  tiles[actualPosX][actualPosY].material = mouseSelected;
}

function renderText(x, y, size, color, text, align) {
  ctx.font = `${size}px Roboto`;
  ctx.fillStyle = color;
  ctx.textAlign = align || 'center';
  
  ctx.fillText(text, x, y);
}

function moveTile(originalTile, newTile) {
  let originalMaterial = originalTile.material.slice();
  originalTile.material = newTile.material;
  newTile.material = originalMaterial;
  
  newTile.updated = true;
}

export function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (faucetOn) {
    mouseDraw(faucetPos);
  }

  for (let x = 0; x < sizeWidth; x++) {
    for (let y = 0; y < sizeHeight; y++) {
      let t = tiles[x][y];
      
      let c = materialColors[t.material](t);
      
      let aboveTile = tiles[x][y - 1] || {material: 'nonExistant', updated: false};
      let belowTile = tiles[x][y + 1] || {material: 'nonExistant', updated: false};
      let sameLeftTile = x <= 0 ? {material: 'nonExistant', updated: false} : tiles[x - 1][y];
      let sameRightTile = x >= sizeWidth - 1 ? {material: 'nonExistant', updated: false} : tiles[x + 1][y];
      
      let adjacentNeighbours = [aboveTile, belowTile, sameLeftTile, sameRightTile];
      
      let adjSameCount = 0;
      let airCount = 0;
      let nonExistantCount = 0;
      for (let neighbour of adjacentNeighbours) {
        if (neighbour.material === t.material) adjSameCount++;
        if (neighbour.material === 'air') airCount++;
        if (neighbour.material === 'nonExistant') nonExistantCount++;
      }

      if (t.material !== 'wall' && adjSameCount + airCount + nonExistantCount !== 4) {
        let orig = Number(t.rand);
        t.rand = 2;

        c = materialColors[t.material](t);

        t.rand = orig;
      }

      if (adjSameCount !== 4) {
        if (!staticLookup[t.material]) {
          let bottom = y === sizeHeight - 1;
          
          if (!bottom && !t.updated) {
            if (densityLookup[belowTile.material] < densityLookup[t.material]) {
              moveTile(t, belowTile);
            } else {
              let belowLeftTile = x <= 0 ? {material: 'nonExistant', updated: false} : tiles[x - 1][y + 1];
              let belowRightTile = x >= sizeWidth - 1 ? {material: 'nonExistant', updated: false} : tiles[x + 1][y + 1];
              
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
            if (neighbouringTile.material === t.material) continue;
            
            if (r.reactants.includes(neighbouringTile.material)) {
              let product = r.product.slice();
              
              t.material = product;
              neighbouringTile.material = product;
            }
          }
        }
      }
      
      let off = (x + (y * sizeWidth)) * 4;
      pixels[off] = c.r;
      pixels[off + 1] = c.g;
      pixels[off + 2] = c.b;
      pixels[off + 3] = c.a;
    }
  }
  
  ctx.putImageData(imgData, 0, 0);
  
  tiles.map((x) => x.map((t) => t.updated = false));
  
  if (!lastCalledTime) {
    lastCalledTime = performance.now();
    fps = 0;
  } else {
    let delta = (performance.now() - lastCalledTime) / 1000;
    fps = Math.round(1 / delta);
    
    lastCalledTime = performance.now();

    fpsEl.innerText = fps;
  }
  
  frame++;
  
  if (useRequestAnim) {
    requestAnimationFrame(update);
  } else {
    setTimeout(update, 0);
  }
}