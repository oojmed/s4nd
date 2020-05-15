import { frameTimeArr } from './exportedVars';

export let canvas, ctx;
export let enabled = false;

let graphWidth = window.innerWidth - 100;
let graphHeight = 150;

let titleSpace = 30;

export function init() {
  canvas = document.createElement('canvas');
  canvas.width = graphWidth;
  canvas.height = graphHeight + titleSpace;
  canvas.id = 'perfOverlay';
  
  document.body.prepend(canvas);
  
  ctx = canvas.getContext('2d');

  update();
};

function renderText(x, y, size, color, text, align) {
  ctx.font = `${size}px Roboto`;
  ctx.fillStyle = color;
  ctx.textAlign = align || 'center';
  
  ctx.fillText(text, x, y);
}

function getRelativePos(value, maxValue) {
  return (value / maxValue) * (graphHeight - 6);
}

export function update() {
  ctx.clearRect(0, 0, graphWidth + titleSpace, graphHeight + titleSpace);

  if (!enabled) return;

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 10;

  ctx.beginPath();

  ctx.moveTo(graphWidth, graphHeight + titleSpace);
  ctx.lineTo(0, graphHeight + titleSpace);
  ctx.lineTo(0, titleSpace);

  ctx.stroke();

  renderText(graphWidth / 2, titleSpace / 2, 16, 'white', 'ticks per frame', 'center');

  ctx.strokeStyle = 'lightgreen';
  ctx.lineWidth = 2;

  let maxValue = Math.max(...frameTimeArr);

  ctx.beginPath();
  ctx.moveTo(6, getRelativePos(frameTimeArr[0]));

  let lastValue = 0;
  let lastRelValue = 0;

  frameTimeArr.forEach((x, i) => {
    let relValue = getRelativePos(x, maxValue);

    if (x > 1 || lastValue > 1) {
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(6 + ((i - 1) * 5), titleSpace + graphHeight - lastRelValue - 6);

      ctx.strokeStyle = 'red';
      
      ctx.lineTo(6 + (i * 5), titleSpace + graphHeight - relValue - 6);

      ctx.stroke();

      // renderText(6 + (i * 2) + 1, graphHeight - relValue - 10, 16, 'red', `${Math.floor(x)}ms`, 'left');

      ctx.beginPath();

      ctx.strokeStyle = 'lightgreen';
    } else {
      ctx.lineTo(6 + (i * 5), titleSpace + graphHeight - relValue - 6);
    }

    lastValue = x;
    lastRelValue = relValue;
  });

  ctx.stroke();

  if (enabled) requestAnimationFrame(update);
}

export function on() {
  enabled = true;

  update();
}

export function off() {
  enabled = false;

  update();
}