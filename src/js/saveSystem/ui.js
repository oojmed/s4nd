import * as Storage from './storage';

import { shaders } from '/js/renderer/shaders';

import * as NameGenerator from './nameGenerator';

let canvas, ctx;

let thumbnailSizeWidth = 320;
let thumbnailSizeHeight = 180;

function createThumbnailCanvas() {
  canvas = document.createElement('canvas');
  canvas.id = 'thumbnailCanvas';

  canvas.width = 10;
  canvas.height = 10;

  document.body.appendChild(canvas);

  ctx = canvas.getContext('2d');
}

function createThumbnail(tiles) {
  if (canvas === undefined) createThumbnailCanvas();

  let worldHeight = tiles.length;
  let worldWidth = tiles[0].length;

  canvas.width = worldWidth;
  canvas.height = worldHeight;

  let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let pixels = imgData.data;

  for (let y = 0; y < worldHeight; y++) {
    for (let x = 0; x < worldWidth; x++) {
      let off = (x + (y * worldWidth)) * 4;

      let mat = tiles[y][x].material;

      let c = shaders[mat](tiles[y][x]);

      pixels[off] = c.r;
      pixels[off + 1] = c.g;
      pixels[off + 2] = c.b;
      pixels[off + 3] = c.a;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  return canvas.toDataURL('image/png');
}

export function createLoadMenu() {
  let loadMenu = document.getElementById('loadMenu');
  loadMenu.innerHTML = '';

  let worlds = Storage.getWorlds();

  for (let name of worlds) {
    let tiles = Storage.getWorld(name);
    let imgSrc = createThumbnail(tiles);
  
    let container = document.createElement('div');

    container.onclick = function() {
      window.overrideTiles(tiles, tiles[0].length, tiles.length);
      window.overridePause(false);

      loadMenu.className = '';
    };

    let img = document.createElement('img');
    img.src = imgSrc;
    img.style.width = `${thumbnailSizeWidth}px`;
    img.style.height = `${thumbnailSizeHeight}px`;

    container.appendChild(img);

    let nameEl = document.createElement('div');
    nameEl.innerText = name;

    container.appendChild(nameEl);

    loadMenu.appendChild(container);
  }
}

function generateWorldName() {
  return NameGenerator.generate();
}

export function saveWorld(tiles) {
  let worldName = prompt('World name:') || generateWorldName();

  Storage.saveWorld(worldName, tiles.slice());

  createLoadMenu();
}