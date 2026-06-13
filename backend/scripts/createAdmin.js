require('dotenv').config({ quiet: true });

const { sql, getPool } = require('../src/config/db');
const { hashPassword, validatePasswordPolicy } = require('../src/utils/passwordPolicy');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeUsername(username, email) {
  const fallback = normalizeEmail(email)
    .split('@')[0]
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 30);

  return String(username || fallback || 'admin').trim();
}

async function main() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const password = process.env.ADMIN_PASSWORD || '';
  const username = normalizeUsername(process.env.ADMIN_USERNAME, email);
  const fullName = String(process.env.ADMIN_FULL_NAME || 'Library Admin').trim();
  const phone = String(process.env.ADMIN_PHONE || '').trim() || null;

  if (!email) {
    throw new Error('ADMIN_EMAIL is required.');
  }

  const passwordCheck = validatePasswordPolicy(password);
  if (!passwordCheck.valid) {
    throw new Error(`ADMIN_PASSWORD is invalid: ${passwordCheck.errors.join(' ')}`);
  }

  const passwordHash = await hashPassword(password);
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    await new sql.Request(transaction).query(`
      IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'ADMIN')
      BEGIN
        INSERT INTO Roles (RoleName) VALUES ('ADMIN')
      END
    `);

    const existing = await new sql.Request(transaction)
      .input('Email', sql.NVarChar(100), email)
      .query('SELECT TOP 1 UserId FROM Users WHERE LOWER(Email) = LOWER(@Email)');

    let userId = existing.recordset[0]?.UserId;

    if (userId) {
      await new sql.Request(transaction)
        .input('UserId', sql.Int, userId)
        .input('Username', sql.NVarChar(50), username)
        .input('PasswordHash', sql.NVarChar(255), passwordHash)
        .input('Phone', sql.NVarChar(20), phone)
        .query(`
          UPDATE Users
          SET Username = @Username,
              PasswordHash = @PasswordHash,
              Phone = @Phone,
              Status = 'ACTIVE',
              EmailVerifiedAt = COALESCE(EmailVerifiedAt, GETDATE()),
              FailedLoginCount = 0,
              LockedUntil = NULL,
              UpdatedAt = GETDATE()
          WHERE UserId = @UserId
        `);
    } else {
      const created = await new sql.Request(transaction)
        .input('Username', sql.NVarChar(50), username)
        .input('Email', sql.NVarChar(100), email)
        .input('PasswordHash', sql.NVarChar(255), passwordHash)
        .input('Phone', sql.NVarChar(20), phone)
        .query(`
          INSERT INTO Users (Username, Email, PasswordHash, Phone, Status, EmailVerifiedAt)
          OUTPUT INSERTED.UserId
          VALUES (@Username, @Email, @PasswordHash, @Phone, 'ACTIVE', GETDATE())
        `);

      userId = created.recordset[0].UserId;
    }

    await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .input('FullName', sql.NVarChar(100), fullName)
      .query(`
        MERGE UserProfiles AS target
        USING (SELECT @UserId AS UserId) AS source
        ON target.UserId = source.UserId
        WHEN MATCHED THEN
          UPDATE SET FullName = @FullName, UpdatedAt = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (UserId, FullName)
          VALUES (@UserId, @FullName);
      `);

    await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(`
        INSERT INTO UserRoles (UserId, RoleId)
        SELECT @UserId, RoleId
        FROM Roles
        WHERE RoleName = 'ADMIN'
          AND NOT EXISTS (
            SELECT 1
            FROM UserRoles
            WHERE UserId = @UserId
              AND RoleId = Roles.RoleId
          )
      `);

    await transaction.commit();
    console.log(`Admin account is ready: ${email}`);
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    await pool.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
