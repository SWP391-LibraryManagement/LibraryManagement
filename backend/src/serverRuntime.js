function createServerRuntime({
  app,
  worker,
  port,
  processRef = process,
  logger = console,
} = {}) {
  let server = null;
  let stopped = false;

  function stop() {
    if (stopped) {
      return;
    }

    stopped = true;
    worker.stop();
    if (server) {
      server.close();
    }
  }

  function start() {
    if (server) {
      return server;
    }

    server = app.listen(port, () => {
      logger.info(`Backend server listening on http://localhost:${port}`);
      void worker.start();
    });
    processRef.once('SIGTERM', stop);
    processRef.once('SIGINT', stop);
    return server;
  }

  return Object.freeze({ start, stop });
}

module.exports = {
  createServerRuntime,
};
