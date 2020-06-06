import * as Compression from './compression';

let saves;

function checkSavesAvaliable() {
  if (saves === undefined) {
    readSaves();
    return false;
  }

  return true;
}

export function saveWorld(saveName, world) {
  checkSavesAvaliable();

  saves[saveName] = Compression.compressWorld(world).slice(); // deep clone
  localStorage.setItem('saves', JSON.stringify(saves));
}

export function getWorld(saveName) {
  checkSavesAvaliable();

  return Compression.decompressWorld(saves[saveName]);
}

export function getWorlds() {
  checkSavesAvaliable();

  return Object.keys(saves);
}

export function readSaves() {
  saves = JSON.parse(localStorage.getItem('saves')) || {};
}