const header = String.raw`   _____                 ____                  ____  _____
  / ___/____  ____  ____/ / /_  ____  _  __   / __ \/ ___/
  \__ \/ __ \/ __ \/ __  / __ \/ __ \| |/_/  / / / /\__ \ 
 ___/ / /_/ / / / / /_/ / /_/ / /_/ />  <   / /_/ /___/ / 
/____/\____/_/ /_/\____/_____/\____/_/|_|   \____//____/  `;

let el;

let last;

export function init() {
  el = document.getElementById('loadingText');

  el.innerText += `${header}\n\n\n`;
}

export function finish() {
  el.style.display = 'none';
}

export function write(s) {
  if (last !== undefined) {
    el.innerText += ` [${(performance.now() - last).toFixed(2)}ms]\n`;
  }

  el.innerText += `${s}`;

  last = performance.now();
}