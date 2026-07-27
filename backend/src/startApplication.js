// @spec BR-FE05-022, FR-FE05-031, AC-FE05-022
async function startApplication({
  runtime,
  schemaReadinessService,
  logger = console,
} = {}) {
  await schemaReadinessService.ensureCatalogMetadataSchema();
  logger.info('Catalog metadata schema is ready.');
  return runtime.start();
}

module.exports = {
  startApplication,
};
