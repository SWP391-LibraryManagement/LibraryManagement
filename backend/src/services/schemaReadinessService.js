const { getPool } = require('../config/db');

// @spec BR-FE05-022, FR-FE05-031, AC-FE05-022
async function checkCatalogMetadataSchema() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT CASE
      WHEN OBJECT_ID(N'dbo.Authors', N'U') IS NOT NULL
       AND OBJECT_ID(N'dbo.Publishers', N'U') IS NOT NULL
       AND OBJECT_ID(N'dbo.Categories', N'U') IS NOT NULL
       AND COL_LENGTH(N'dbo.Authors', N'Status') IS NOT NULL
       AND COL_LENGTH(N'dbo.Authors', N'CreatedAt') IS NOT NULL
       AND COL_LENGTH(N'dbo.Publishers', N'Status') IS NOT NULL
       AND COL_LENGTH(N'dbo.Publishers', N'CreatedAt') IS NOT NULL
       AND COL_LENGTH(N'dbo.Categories', N'Status') IS NOT NULL
       AND COL_LENGTH(N'dbo.Categories', N'CreatedAt') IS NOT NULL
      THEN 1
      ELSE 0
    END AS isReady;
  `);

  return result.recordset?.[0]?.isReady === 1;
}

const defaultSchemaReadinessService = {
  checkCatalogMetadataSchema,
};

module.exports = {
  checkCatalogMetadataSchema,
  defaultSchemaReadinessService,
};
