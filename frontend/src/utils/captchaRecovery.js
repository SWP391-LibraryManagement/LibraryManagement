export function isTransientCaptchaLoadError(error) {
  const status = Number(error?.response?.status);
  if (!Number.isFinite(status)) return true;
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

export async function loadCaptchaWithRetry(
  load,
  {
    attempts = 2,
    retryDelayMs = 250,
    shouldRetry = isTransientCaptchaLoadError,
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
      if (attempt >= attempts || !shouldRetry(error)) throw error;
      await wait(retryDelayMs);
    }
  }

  throw lastError;
}
