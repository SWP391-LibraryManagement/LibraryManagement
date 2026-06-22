/*
 * Demo helper — chuyển nhanh trạng thái của demo.member giữa 2 tình huống FE07.
 *
 * Vì sao cần: FE07 (mượn) kiểm tra phạt + sách quá hạn từ DB THẬT, nhưng UI thu
 * phạt FE09 hiện là dữ liệu mock (không cập nhật DB). Script này thao tác trực
 * tiếp DB để bạn demo được cả 2 tình huống mà không phụ thuộc UI mock.
 *
 *   node scripts/demoMember.js block   # còn phạt + sách quá hạn -> member BỊ CHẶN mượn (tình huống 1)
 *   node scripts/demoMember.js clear   # trả hết phạt + trả sách -> member MƯỢN ĐƯỢC (tình huống 2)
 *   node scripts/demoMember.js status  # xem trạng thái hiện tại
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const { sql, getPool } = require('../src/config/db');

const EMAIL = 'demo.member@example.test';
const mode = (process.argv[2] || 'status').toLowerCase();

async function setState(pool, paid, returned) {
  // 1) Phạt
  await pool
    .request()
    .input('Email', sql.NVarChar(100), EMAIL)
    .input('Status', sql.NVarChar(20), paid ? 'PAID' : 'UNPAID')
    .query(`
      UPDATE f SET f.Status = @Status,
                   f.PaidAt = CASE WHEN @Status='PAID' THEN GETDATE() ELSE NULL END
      FROM Fines f JOIN Users u ON u.UserId = f.UserId
      WHERE LOWER(u.Email) = LOWER(@Email)`);

  // 2) Sách đang mượn / quá hạn  + trạng thái copy tương ứng
  const detailStatus = returned ? 'RETURNED' : 'BORROWED';
  const copyStatus = returned ? 'AVAILABLE' : 'BORROWED';
  await pool
    .request()
    .input('Email', sql.NVarChar(100), EMAIL)
    .input('DStatus', sql.NVarChar(20), detailStatus)
    .input('CStatus', sql.NVarChar(20), copyStatus)
    .query(`
      UPDATE bd SET bd.Status = @DStatus,
                    bd.ReturnDate = CASE WHEN @DStatus='RETURNED' THEN GETDATE() ELSE NULL END
      FROM BorrowDetails bd
      JOIN BorrowRequests br ON br.RequestId = bd.RequestId
      JOIN Users u ON u.UserId = br.UserId
      WHERE LOWER(u.Email) = LOWER(@Email) AND bd.Status IN ('BORROWED','RETURNED','OVERDUE');

      UPDATE bc SET bc.Status = @CStatus
      FROM BookCopies bc
      WHERE bc.CopyId IN (
        SELECT bd.CopyId FROM BorrowDetails bd
        JOIN BorrowRequests br ON br.RequestId = bd.RequestId
        JOIN Users u ON u.UserId = br.UserId
        WHERE LOWER(u.Email) = LOWER(@Email)
      );`);
}

(async () => {
  const pool = await getPool();
  try {
    if (mode === 'block') await setState(pool, false, false);
    else if (mode === 'clear') await setState(pool, true, true);

    const fines = await pool.request().input('Email', sql.NVarChar(100), EMAIL).query(`
      SELECT f.FineId, f.Amount, f.Status FROM Fines f JOIN Users u ON u.UserId=f.UserId
      WHERE LOWER(u.Email)=LOWER(@Email)`);
    const loans = await pool.request().input('Email', sql.NVarChar(100), EMAIL).query(`
      SELECT bd.BorrowDetailId, bd.CopyId, bd.Status, bd.DueDate FROM BorrowDetails bd
      JOIN BorrowRequests br ON br.RequestId=bd.RequestId JOIN Users u ON u.UserId=br.UserId
      WHERE LOWER(u.Email)=LOWER(@Email)`);
    console.log(`\n[demo.member] mode=${mode}`);
    console.log('Fines:'); console.table(fines.recordset);
    console.log('Loans:'); console.table(loans.recordset);
  } finally {
    await pool.close();
  }
})().catch((e) => { console.error(e.message); process.exitCode = 1; });
