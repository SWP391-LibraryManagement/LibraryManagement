const crypto = require('crypto');

const SEGMENTS = {
  a: [4, 4, 22, 4],
  b: [24, 6, 24, 22],
  c: [24, 26, 24, 42],
  d: [4, 44, 22, 44],
  e: [2, 26, 2, 42],
  f: [2, 6, 2, 22],
  g1: [4, 24, 13, 24],
  g2: [13, 24, 22, 24],
  h: [4, 6, 13, 22],
  i: [22, 6, 13, 22],
  j: [4, 42, 13, 26],
  k: [22, 42, 13, 26],
  l: [13, 6, 13, 22],
  m: [13, 26, 13, 42],
};

const GLYPHS = {
  A: ['a', 'b', 'c', 'e', 'f', 'g1', 'g2'],
  B: ['a', 'b', 'c', 'd', 'e', 'f', 'g1', 'g2'],
  C: ['a', 'd', 'e', 'f'],
  D: ['a', 'b', 'c', 'd', 'e', 'f'],
  E: ['a', 'd', 'e', 'f', 'g1', 'g2'],
  F: ['a', 'e', 'f', 'g1', 'g2'],
  G: ['a', 'c', 'd', 'e', 'f', 'g2'],
  H: ['b', 'c', 'e', 'f', 'g1', 'g2'],
  J: ['b', 'c', 'd', 'e'],
  K: ['e', 'f', 'g1', 'h', 'k', 'm'],
  L: ['d', 'e', 'f'],
  M: ['b', 'c', 'e', 'f', 'h', 'i', 'k'],
  N: ['b', 'c', 'e', 'f', 'h', 'k'],
  P: ['a', 'b', 'e', 'f', 'g1', 'g2'],
  Q: ['a', 'b', 'c', 'd', 'e', 'f', 'k'],
  R: ['a', 'b', 'e', 'f', 'g1', 'g2', 'k'],
  S: ['a', 'c', 'd', 'f', 'g1', 'g2'],
  T: ['a', 'l', 'm'],
  U: ['b', 'c', 'd', 'e', 'f'],
  V: ['e', 'f', 'j', 'k'],
  W: ['b', 'c', 'd', 'e', 'f', 'j', 'k'],
  X: ['h', 'i', 'j', 'k'],
  Y: ['h', 'i', 'm'],
  Z: ['a', 'd', 'i', 'j'],
};

function renderCaptchaSvgDataUri(answer, { randomInt = crypto.randomInt } = {}) {
  const glyphs = [...answer].map((letter, index) => {
    const rotation = randomInt(9) - 4;
    const offsetY = randomInt(5) - 2;
    const paths = GLYPHS[letter].map((segmentName) => {
      const [x1, y1, x2, y2] = SEGMENTS[segmentName];
      return `<path d="M${x1} ${y1} L${x2} ${y2}"/>`;
    }).join('');

    return `<g transform="translate(${8 + index * 34} ${3 + offsetY}) rotate(${rotation} 13 24)">${paths}</g>`;
  }).join('');

  const noise = Array.from({ length: 7 }, () => {
    const x1 = randomInt(180);
    const y1 = randomInt(54);
    const x2 = randomInt(180);
    const y2 = randomInt(54);
    return `<path class="noise" d="M${x1} ${y1} L${x2} ${y2}"/>`;
  }).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="54" viewBox="0 0 180 54"><rect width="180" height="54" fill="#f4eadb"/><g fill="none" stroke="#6d4c41" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${glyphs}</g><g fill="none" stroke="#b58b68" stroke-width="1" opacity="0.55">${noise}</g></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

module.exports = { renderCaptchaSvgDataUri };
