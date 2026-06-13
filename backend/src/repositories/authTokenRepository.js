const { sql, getPool } = require('../config/db');

function mapToken(row) {
  if (!row) {
    return null;
  }

  return {
    tokenId: row.TokenId,
    userId: row.UserId,
    tokenType: row.TokenType,
    tokenHash: row.TokenHash,
    expiresAt: row.ExpiresAt,
    usedAt: row.UsedAt,
    revokedAt: row.RevokedAt,
    createdAt: row.CreatedAt,
    createdByIp: row.CreatedByIp,
  };
}

async function createToken({ userId, tokenType, tokenHash, expiresAt, createdByIp }) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .input('TokenType', sql.NVarChar(30), tokenType)
    .input('TokenHash', sql.NVarChar(255), tokenHash)
    .input('ExpiresAt', sql.DateTime, expiresAt)
    .input('CreatedByIp', sql.NVarChar(50), createdByIp || null)
    .query(`
      INSERT INTO AuthTokens (UserId, TokenType, TokenHash, ExpiresAt, CreatedByIp)
      OUTPUT INSERTED.*
      VALUES (@UserId, @TokenType, @TokenHash, @ExpiresAt, @CreatedByIp)
    `);

  return mapToken(result.recordset[0]);
}

async function findActiveTokenByHash(tokenType, tokenHash) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('TokenType', sql.NVarChar(30), tokenType)
    .input('TokenHash', sql.NVarChar(255), tokenHash)
    .query(`
      SELECT TOP 1 *
      FROM AuthTokens
      WHERE TokenType = @TokenType
        AND TokenHash = @TokenHash
        AND UsedAt IS NULL
        AND RevokedAt IS NULL
      ORDER BY CreatedAt DESC
    `);

  return mapToken(result.recordset[0]);
}

async function findActiveTokenById(tokenId, tokenType) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('TokenId', sql.Int, tokenId)
    .input('TokenType', sql.NVarChar(30), tokenType)
    .query(`
      SELECT TOP 1 *
      FROM AuthTokens
      WHERE TokenId = @TokenId
        AND TokenType = @TokenType
        AND UsedAt IS NULL
        AND RevokedAt IS NULL
    `);

  return mapToken(result.recordset[0]);
}

async function markTokenUsed(tokenId) {
  const pool = await getPool();
  await pool
    .request()
    .input('TokenId', sql.Int, tokenId)
    .query(`
      UPDATE AuthTokens
      SET UsedAt = COALESCE(UsedAt, GETDATE())
      WHERE TokenId = @TokenId
    `);
}

async function revokeToken(tokenId) {
  const pool = await getPool();
  await pool
    .request()
    .input('TokenId', sql.Int, tokenId)
    .query(`
      UPDATE AuthTokens
      SET RevokedAt = COALESCE(RevokedAt, GETDATE())
      WHERE TokenId = @TokenId
    `);
}

async function revokeActiveTokensForUserType(userId, tokenType) {
  const pool = await getPool();
  await pool
    .request()
    .input('UserId', sql.Int, userId)
    .input('TokenType', sql.NVarChar(30), tokenType)
    .query(`
      UPDATE AuthTokens
      SET RevokedAt = COALESCE(RevokedAt, GETDATE())
      WHERE UserId = @UserId
        AND TokenType = @TokenType
        AND UsedAt IS NULL
        AND RevokedAt IS NULL
    `);
}

async function revokeActiveTokensForUser(userId) {
  const pool = await getPool();
  await pool
    .request()
    .input('UserId', sql.Int, userId)
    .query(`
      UPDATE AuthTokens
      SET RevokedAt = COALESCE(RevokedAt, GETDATE())
      WHERE UserId = @UserId
        AND UsedAt IS NULL
        AND RevokedAt IS NULL
    `);
}

module.exports = {
  createToken,
  findActiveTokenByHash,
  findActiveTokenById,
  markTokenUsed,
  revokeToken,
  revokeActiveTokensForUserType,
  revokeActiveTokensForUser,
};
