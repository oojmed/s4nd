import { frameTimeArr } from './exportedVars';

export let canvas, ctx;

let graphWidth = window.innerWidth - 200;
let graphHeight = 200;

export function init() {
  canvas = document.createElement('canvas');
  canvas.width = graphWidth;
  canvas.height = graphHeight;
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
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 10;

  ctx.clearRect(0, 0, graphWidth, graphHeight);

  ctx.beginPath();

  ctx.moveTo(graphWidth, graphHeight);
  ctx.lineTo(0, graphHeight);
  ctx.lineTo(0, 0);

  ctx.stroke();

  ctx.strokeStyle = 'lightgreen';
  ctx.lineWidth = 2;

  let maxValue = Math.max(...frameTimeArr);

  ctx.beginPath();
  ctx.moveTo(6, getRelativePos(frameTimeArr[0]));

  let lastValue = 0;
  let lastRelValue = 0;

  frameTimeArr.forEach((x, i) => {
    let relValue = getRelativePos(x, maxValue);

    if (x > 5 || lastValue > 5) {
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(6 + ((i - 1) * 2), lastRelValue);

      ctx.strokeStyle = 'red';
      
      ctx.lineTo(6 + (i * 2), relValue);

      ctx.stroke();

      ctx.beginPath();

      ctx.strokeStyle = 'lightgreen';
    } else {
      ctx.lineTo(6 + (i * 2), relValue);
    }

    lastValue = x;
    lastRelValue = relValue;
  });

  ctx.stroke();

  requestAnimationFrame(update);
}