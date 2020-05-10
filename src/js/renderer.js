export let canvas, ctx;
export let fps = 0;
let lastCalledTime;
let fpsArr = [];

let frame = 0;

let tiles = [];

let scaleFactor = 8;

let sizeWidth = Math.floor(window.innerWidth / scaleFactor);
let sizeHeight = Math.floor(window.innerHeight / scaleFactor);

let imgData;
let pixels;

let fpsEl, selEl, dbgEl;

let baseTile = { type: 'air', updated: false, rand: 0 };

let mousePos = {x: 0, y: 0};
let mouseDrawInterval;
let mouseDown = false;

let faucetPos = {x: 0, y: 0};
let faucetOn = false;

let types = ['sand', 'wall', 'air'];
let mouseSelected = 0;

function initTiles() {
  tiles = Array.from(Array(sizeWidth), () => Array.apply(undefined, Array(sizeHeight)).map((x) => Object. assign({}, baseTile)));

  tiles = tiles.map((x) => x.map((t) => { t.rand = Math.random(); return t; }));

  // border
  for (let x = 0; x < sizeWidth; x++) {
    tiles[x][0].type = 'wall';
    tiles[x][sizeHeight - 1].type = 'wall';
  }

  for (let y = 0; y < sizeHeight; y++) {
    tiles[0][y].type = 'wall';
    tiles[sizeWidth - 1][y].type = 'wall';
  }
}

export function init() {
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
  selEl = document.getElementById('sel');
  dbgEl = document.getElementById('dbg');

  dbgEl.innerText = `${sizeWidth}x${sizeHeight} - ${sizeWidth * sizeHeight}`;

  initTiles();

  update();

  document.onmousedown = function(e) {
    if (e.which === 1) {
      mousePos = {x: e.clientX, y: e.clientY};

      mouseDraw();

      mouseDrawInterval = setInterval(mouseDraw, 1);

      mouseDown = true;
    }

    if (e.which === 3) {
      mouseSelected++;

      if (mouseSelected > types.length - 1) {
        mouseSelected = 0;
      }

      selEl.innerText = types[mouseSelected];
    }
  };

  document.onmousemove = function(e) {
    mousePos = {x: e.clientX, y: e.clientY};

    if (mouseDown) mouseDraw();
  };

  document.onmouseup = function(e) {
    clearInterval(mouseDrawInterval);

    mouseDown = false;
  };

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
}

function mouseDraw(pos = mousePos) {
  let actualPosX = Math.floor(pos.x / scaleFactor);
  let actualPosY = Math.floor(pos.y / scaleFactor);

  tiles[actualPosX][actualPosY].type = types[mouseSelected];
}

function renderText(x, y, size, color, text, align) {
  ctx.font = `${size}px Roboto`;
  ctx.fillStyle = color;
  ctx.textAlign = align || 'center';

  ctx.fillText(text, x, y);
}

function moveTile(originalTile, newTile) {
  let originalType = originalTile.type.slice();
  originalTile.type = newTile.type;
  newTile.type = originalType;

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

      let c = {r: 0, g: 0, b: 0};

      if (t.type === 'sand') {
        let bottom = y === sizeHeight - 1;

        if (!bottom && !t.updated) {
          let belowTile = tiles[x][y + 1];

          if (belowTile.type === 'air') {
            moveTile(t, belowTile);
          } else {
            let belowLeftTile = x <= 0 ? {type: 'nonExistant', updated: false} : tiles[x - 1][y + 1];
            let belowRightTile = x >= sizeWidth - 1 ? {type: 'nonExistant', updated: false} : tiles[x + 1][y + 1];

            if (belowLeftTile.type === 'air' && belowRightTile === 'air') {
              t.type = 'air';

              if (Math.random() >= 0.5) {
                moveTile(t, belowRightTile);
              } else {
                moveTile(t, belowLeftTile);
              }
            } else {
              if (belowLeftTile.type === 'air') {
                moveTile(t, belowLeftTile);
              }

              if (belowRightTile.type === 'air') {
                moveTile(t, belowRightTile);
              }
            }
          }
        }

        c = {r: 250 - (t.rand * 40), g: 201 - (t.rand * 30), b: 55};
      }

      if (t.type === 'wall') {
        c = {r: 120 - (t.rand * 45), g: 120 - (t.rand * 40), b: 120 - (t.rand * 35)};
      }

      let off = (x + (y * sizeWidth)) * 4;
      pixels[off] = c.r;
      pixels[off + 1] = c.g;
      pixels[off + 2] = c.b;
      pixels[off + 3] = 255;
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

    if (fpsArr.length >= 1000) {
      fpsArr.pop();
    }

    fpsArr.unshift(fps);
  }

  fpsEl.innerText = Math.round(fpsArr.reduce((p, c) => p + c, 0) / fpsArr.length)

  frame++;

  requestAnimationFrame(update);
}