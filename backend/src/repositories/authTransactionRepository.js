const { sql, getPool } = require('../config/db');

async function withTransaction(work) {
  const transaction = new sql.Transaction(await getPool());
  await transaction.begin();

  try {
    const result = await work(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = { withTransaction };
