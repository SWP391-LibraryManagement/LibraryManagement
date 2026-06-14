const sql = require('mssql');

let poolPromise;

function buildConfig() {
  const {
    DB_SERVER,
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    DB_PORT,
    DB_INSTANCE_NAME,
    DB_ENCRYPT,
    DB_TRUST_SERVER_CERTIFICATE,
  } = process.env;

  if (!DB_SERVER || !DB_NAME) {
    throw new Error('Missing SQL Server configuration. DB_SERVER and DB_NAME are required.');
  }

  const server = DB_SERVER.trim() === '.' ? 'localhost' : DB_SERVER;

  const config = {
    server,
    database: DB_NAME,
    options: {
      encrypt: DB_ENCRYPT === 'true',
      trustServerCertificate: DB_TRUST_SERVER_CERTIFICATE !== 'false',
    },
  };

  if (DB_PORT) {
    config.port = Number(DB_PORT);
  }

  if (DB_INSTANCE_NAME) {
    config.options.instanceName = DB_INSTANCE_NAME;
  }

  if (DB_USER && DB_PASSWORD) {
    config.user = DB_USER;
    config.password = DB_PASSWORD;
  }

  return config;
}

async function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(buildConfig());
  }

  return poolPromise;
}

function resetPoolForTests() {
  poolPromise = undefined;
}

module.exports = {
  sql,
  getPool,
  resetPoolForTests,
};
