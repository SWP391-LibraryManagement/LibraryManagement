const { EventEmitter } = require('events');
const { createServerRuntime } = require('../src/serverRuntime');

function makeRuntime() {
  const processRef = new EventEmitter();
  const server = { close: jest.fn() };
  const app = {
    listen: jest.fn((port, callback) => {
      callback();
      return server;
    }),
  };
  const worker = {
    start: jest.fn().mockResolvedValue({ started: true }),
    stop: jest.fn(),
  };
  const logger = { info: jest.fn() };
  const runtime = createServerRuntime({
    app,
    worker,
    port: 3000,
    processRef,
    logger,
  });

  return { runtime, processRef, server, app, worker, logger };
}

test.each(['SIGTERM', 'SIGINT'])('starts worker after listen and stops on %s', (signal) => {
  const harness = makeRuntime();

  const server = harness.runtime.start();
  harness.processRef.emit(signal);

  expect(server).toBe(harness.server);
  expect(harness.app.listen).toHaveBeenCalledWith(3000, expect.any(Function));
  expect(harness.worker.start).toHaveBeenCalledTimes(1);
  expect(harness.worker.stop).toHaveBeenCalledTimes(1);
  expect(harness.server.close).toHaveBeenCalledTimes(1);
});

test('does not start the same runtime twice', () => {
  const harness = makeRuntime();

  const first = harness.runtime.start();
  const second = harness.runtime.start();

  expect(second).toBe(first);
  expect(harness.app.listen).toHaveBeenCalledTimes(1);
  expect(harness.worker.start).toHaveBeenCalledTimes(1);
});
