export let frameTimeArr = [];

export function addTime(frameTime) {
  frameTimeArr.unshift(frameTime);

  if (frameTimeArr.length > 300) frameTimeArr.pop();
}