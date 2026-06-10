const sql = require('mssql');
require('dotenv').config();
const { AppException } = require('../CustomException/AppException');

const requiredEnvVars = ['DB_SERVER', 'DB_NAME'];

function throwDatabaseException(message, cause) {
  const error = new AppException(500, 500, message);
  if (cause) {
    error.cause = cause;
  }

  throw error;
}

for (const envName of requiredEnvVars) {
  if (!process.env[envName]) {
    throwDatabaseException(`Missing required database environment variable: ${envName}`);
  }
}

const dbConfig = {
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 1433),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
  },
  pool: {
    max: Number(process.env.DB_POOL_MAX || 10),
    min: Number(process.env.DB_POOL_MIN || 0),
    idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT || 30000),
  },
};

let poolPromise = null;

async function getDbPool() {
  if (!poolPromise) {
    try {
      poolPromise = sql.connect(dbConfig);
    } catch (error) {
      poolPromise = null;
      throwDatabaseException('Failed to initialize database connection.', error);
    }
  }

  try {
    return await poolPromise;
  } catch (error) {
    poolPromise = null;
    throwDatabaseException('Failed to connect to database.', error);
  }
}

async function closeDbPool() {
  if (poolPromise) {
    try {
      const pool = await poolPromise;
      await pool.close();
    } catch (error) {
      throwDatabaseException('Failed to close database connection.', error);
    } finally {
      poolPromise = null;
    }
  }
}

module.exports = {
  sql,
  dbConfig,
  getDbPool,
  closeDbPool,
};