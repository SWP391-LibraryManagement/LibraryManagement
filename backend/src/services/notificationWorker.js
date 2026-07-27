function createNotificationWorker({
  processor,
  enabled = false,
  intervalMs = 60000,
  batchSize = 20,
  setIntervalFn = setInterval,
  clearIntervalFn = clearInterval,
  logger = console,
} = {}) {
  if (!processor || typeof processor.processPendingNotifications !== 'function') {
    throw new TypeError('Notification worker requires a pending notification processor.');
  }

  let timer = null;
  let started = false;
  let running = false;

  async function runOnce() {
    if (!enabled || !started || running) {
      return { skipped: true };
    }

    running = true;
    try {
      return await processor.processPendingNotifications({ limit: batchSize });
    } catch {
      logger.error('[notification worker]', {
        code: 'NOTIFICATION_WORKER_BATCH_FAILED',
      });
      return { failed: true };
    } finally {
      running = false;
    }
  }

  async function start() {
    if (!enabled || started) {
      return { started: false };
    }

    started = true;
    timer = setIntervalFn(() => runOnce(), intervalMs);
    const result = await runOnce();
    return { started: true, result };
  }

  function stop() {
    started = false;
    if (timer !== null) {
      clearIntervalFn(timer);
      timer = null;
    }
  }

  return Object.freeze({ start, runOnce, stop });
}

module.exports = {
  createNotificationWorker,
};
