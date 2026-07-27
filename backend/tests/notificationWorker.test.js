const { createNotificationWorker } = require('../src/services/notificationWorker');

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function makeHarness({ enabled = true, processor } = {}) {
  const scheduled = [];
  const timer = { id: 1 };
  const clearIntervalFn = jest.fn();
  const logger = { error: jest.fn() };
  const effectiveProcessor =
    processor || {
      processPendingNotifications: jest.fn().mockResolvedValue({
        processed: 0,
        failed: 0,
        notifications: [],
      }),
    };
  const worker = createNotificationWorker({
    processor: effectiveProcessor,
    enabled,
    intervalMs: 60000,
    batchSize: 20,
    setIntervalFn(callback, intervalMs) {
      scheduled.push({ callback, intervalMs });
      return timer;
    },
    clearIntervalFn,
    logger,
  });

  return {
    worker,
    scheduled,
    timer,
    clearIntervalFn,
    logger,
    processor: effectiveProcessor,
  };
}

test('disabled worker creates no timer and performs no work', async () => {
  const harness = makeHarness({ enabled: false });

  await harness.worker.start();

  expect(harness.scheduled).toHaveLength(0);
  expect(harness.processor.processPendingNotifications).not.toHaveBeenCalled();
});

test('enabled worker runs at startup and on its configured interval', async () => {
  const harness = makeHarness();

  await harness.worker.start();
  await harness.scheduled[0].callback();

  expect(harness.scheduled[0].intervalMs).toBe(60000);
  expect(harness.processor.processPendingNotifications).toHaveBeenNthCalledWith(1, { limit: 20 });
  expect(harness.processor.processPendingNotifications).toHaveBeenNthCalledWith(2, { limit: 20 });
});

test('overlapping passes are skipped and later passes resume', async () => {
  const first = deferred();
  const processor = {
    processPendingNotifications: jest
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue({ processed: 0, failed: 0, notifications: [] }),
  };
  const harness = makeHarness({ processor });
  const startup = harness.worker.start();

  await expect(harness.worker.runOnce()).resolves.toEqual({ skipped: true });
  first.resolve({ processed: 1, failed: 0, notifications: [] });
  await startup;
  await harness.worker.runOnce();

  expect(processor.processPendingNotifications).toHaveBeenCalledTimes(2);
});

test('safe worker failure does not stop later passes', async () => {
  const processor = {
    processPendingNotifications: jest
      .fn()
      .mockRejectedValueOnce(new Error('recipient@example.test provider-secret'))
      .mockResolvedValue({ processed: 1, failed: 0, notifications: [] }),
  };
  const harness = makeHarness({ processor });

  await harness.worker.start();
  await harness.scheduled[0].callback();

  expect(processor.processPendingNotifications).toHaveBeenCalledTimes(2);
  expect(harness.logger.error).toHaveBeenCalledWith('[notification worker]', {
    code: 'NOTIFICATION_WORKER_BATCH_FAILED',
  });
  expect(JSON.stringify(harness.logger.error.mock.calls)).not.toContain('provider-secret');
  expect(JSON.stringify(harness.logger.error.mock.calls)).not.toContain('recipient@example.test');
});

test('stop clears the active timer and prevents later work', async () => {
  const harness = makeHarness();
  await harness.worker.start();

  harness.worker.stop();
  await harness.worker.runOnce();

  expect(harness.clearIntervalFn).toHaveBeenCalledWith(harness.timer);
  expect(harness.processor.processPendingNotifications).toHaveBeenCalledTimes(1);
});
