const E2E_BACKEND_URL = `http://127.0.0.1:${Number(process.env.E2E_BACKEND_PORT || 3100)}`;

async function solveCaptcha(page) {
  const image = page.getByRole('img', { name: 'CAPTCHA gồm 4 đến 6 chữ cái' });
  await image.waitFor({ state: 'visible' });

  const response = await page.request.get(`${E2E_BACKEND_URL}/__e2e__/captcha-answer`);
  if (!response.ok()) throw new Error('Could not read the E2E CAPTCHA answer.');
  const { answer } = await response.json();
  if (!/^[A-Z]{4,6}$/.test(answer || '')) throw new Error('E2E CAPTCHA answer was unavailable.');

  await page.getByRole('textbox', { name: 'Nhập mã CAPTCHA', exact: true }).fill(answer);
}

module.exports = { solveCaptcha };
