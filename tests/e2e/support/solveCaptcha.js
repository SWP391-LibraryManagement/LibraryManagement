const CAPTCHA_IMAGE_PREFIX = 'data:image/svg+xml;base64,';

async function solveCaptcha(page) {
  const image = page.getByRole('img', { name: 'CAPTCHA gồm 4 đến 6 chữ cái' });
  await image.waitFor({ state: 'visible' });

  const source = await image.getAttribute('src');
  if (!source?.startsWith(CAPTCHA_IMAGE_PREFIX)) {
    throw new Error('Expected the CAPTCHA challenge to use an SVG data URI.');
  }

  const svg = Buffer.from(source.slice(CAPTCHA_IMAGE_PREFIX.length), 'base64').toString('utf8');
  const answer = svg.match(/<text[^>]*>([A-Z]{4,6})<\/text>/)?.[1];
  if (!answer) {
    throw new Error('Could not read the rendered CAPTCHA answer.');
  }

  await page.getByRole('textbox', { name: 'Nhập mã CAPTCHA', exact: true }).fill(answer);
}

module.exports = { solveCaptcha };
