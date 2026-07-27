const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
  quiet: true,
});

const { createApp } = require('./app');
const env = require('./config/env');
const { defaultNotificationService } = require('./services/notificationService');
const { defaultSchemaReadinessService } = require('./services/schemaReadinessService');
const { createNotificationWorker } = require('./services/notificationWorker');
const { createServerRuntime } = require('./serverRuntime');
const { startApplication } = require('./startApplication');

const app = createApp();
const processor = defaultNotificationService.createSystemNotificationProcessor();
const worker = createNotificationWorker({
  processor,
  enabled: env.notificationWorkerEnabled,
  intervalMs: env.notificationWorkerIntervalMs,
  batchSize: env.notificationWorkerBatchSize,
});
const runtime = createServerRuntime({
  app,
  worker,
  port: Number(process.env.PORT || 3000),
});

if (require.main === module) {
  void startApplication({
    runtime,
    schemaReadinessService: defaultSchemaReadinessService,
  }).catch((error) => {
    console.error(`Backend startup failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = app;
