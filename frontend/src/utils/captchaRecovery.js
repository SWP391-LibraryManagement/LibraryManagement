export async function loadCaptchaWithRetry(
  load,
  {
    attempts = 2,
    retryDelayMs = 250,
    wait = (milliseconds) => new Promise(
      (resolve) => globalThis.setTimeout(resolve, milliseconds)
    ),
  } = {}
) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await load();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await wait(retryDelayMs);
    }
  }

  throw lastError;
}
