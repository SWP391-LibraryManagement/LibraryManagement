const defineModel = require('./defineModel');

module.exports = defineModel({
  name: 'Reservation',
  tableName: 'Reservations',
  primaryKey: 'reservationId',
  columns: [
    { attribute: 'reservationId', name: 'ReservationId', type: 'INT', primaryKey: true, identity: true },
    { attribute: 'userId', name: 'UserId', type: 'INT', required: true, references: { table: 'Users', column: 'UserId' } },
    { attribute: 'copyId', name: 'CopyId', type: 'INT', required: true, references: { table: 'BookCopies', column: 'CopyId' } },
    { attribute: 'reservedAt', name: 'ReservedAt', type: 'DATETIME', required: true, default: 'GETDATE()' },
    { attribute: 'queuePosition', name: 'QueuePosition', type: 'INT', nullable: true },
    { attribute: 'expiresAt', name: 'ExpiresAt', type: 'DATETIME', nullable: true },
    { attribute: 'notifiedAt', name: 'NotifiedAt', type: 'DATETIME', nullable: true },
    { attribute: 'cancelledAt', name: 'CancelledAt', type: 'DATETIME', nullable: true },
    { attribute: 'status', name: 'Status', type: 'NVARCHAR(20)', required: true, default: 'ACTIVE', allowedValues: ['ACTIVE', 'FULFILLED', 'CANCELLED', 'EXPIRED'] },
    { attribute: 'createdAt', name: 'CreatedAt', type: 'DATETIME', required: true, default: 'GETDATE()' },
    { attribute: 'updatedAt', name: 'UpdatedAt', type: 'DATETIME', nullable: true },
  ],
});
