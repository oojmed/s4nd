import * as BetterMath from '../betterMath';

export function compressWorld(tiles) {
  let worldHeight = tiles.length;
  let worldWidth = tiles[0].length;

  let compressed = [worldWidth, worldHeight];

  let lastMat = tiles[0][0].material;
  let lastNum = 0;

  for (let y = 0; y < worldHeight; y++) {
    for (let x = 0; x < worldWidth; x++) {
      let mat = tiles[y][x].material;

      if (mat === lastMat) {
        lastNum++;
      } else {
        compressed.push(`${lastNum}|${window.global_materials.indexOf(lastMat)}`);

        lastNum = 1;
        lastMat = mat;
      }
    }
  }

  compressed.push(`${lastNum}|${window.global_materials.indexOf(lastMat)}`);

  compressed = compressed.join(' ');


  //return compressed;
}

export function decompressWorld(compressed) {
  let split = compressed.split(' ');

  let worldWidth = parseInt(split.shift());
  let worldHeight = parseInt(split.shift());

  let tiles = new Array(worldHeight).fill(0).map((_) => new Array(worldWidth));

  let t = 0;
  for (let i = 0; i < split.length; i++) {
    let spl = split[i].split('|');
  
    let num = parseInt(spl[0]);
    let mat = window.global_materials[parseInt(spl[1])];

    for (; num--; t++) {
      let tIndexHeight = Math.floor(t / worldWidth);
      let tIndexWidth = t % worldWidth;

      tiles[tIndexHeight][tIndexWidth] = {};

      tiles[tIndexHeight][tIndexWidth].material = mat;
      tiles[tIndexHeight][tIndexWidth].rand = BetterMath.random();
      tiles[tIndexHeight][tIndexWidth].age = 0;
    }
  }

  return tiles;
}

/*function kiloSize(str) {
  return byteSize(str) / 1024;
}

function byteSize(str) {
  return new Blob([str]).size;
}

window.test1 = compressWorld;
window.test2 = decompressWorld;*/
