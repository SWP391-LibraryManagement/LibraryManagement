const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');

const { createAuthRoutes } = require('./routes/authRoutes');
const { createBorrowingRoutes } = require('./routes/borrowingRoutes');
const { createNotificationRoutes } = require('./routes/notificationRoutes');
const { createReportRoutes } = require('./routes/reportRoutes');
const { createReservationRoutes } = require('./routes/reservationRoutes');
const { createUserManagementRoutes } = require('./routes/userManagementRoutes');
const { createBookRoutes } = require('./routes/bookRoutes');
const { createFineRoutes } = require('./routes/fineRoutes');
const { createProfileRoutes } = require('./routes/profileRoutes');
const bookRoutes = require('./routes/bookRoutes');

const errorHandler = require('./middleware/errorHandler');
const { defaultAuthService } = require('./services/authService');
const { defaultBorrowingService } = require('./services/borrowingService');
const { defaultNotificationService } = require('./services/notificationService');
const { defaultReportService } = require('./services/reportService');
const { defaultReservationService } = require('./services/reservationService');
const { defaultProfileService } = require('./services/profileService');

function createApp({
  authService = defaultAuthService,
  borrowingService = defaultBorrowingService,
  notificationService = defaultNotificationService,
  reportService = defaultReportService,
  reservationService = defaultReservationService,
  profileService = defaultProfileService,
  userManagementService,
} = {}) {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json());
  app.use('/uploads/avatars', express.static(path.resolve(__dirname, '../uploads/avatars')));

  app.get('/', (req, res) => {
    res.json({
      message: 'Library Management backend is running',
      status: 'ok',
    });
  });

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
    });
  });

  app.use('/api/auth', createAuthRoutes(authService));
  app.use('/api', createBorrowingRoutes({ authService, borrowingService }));
  app.use('/api/notifications', createNotificationRoutes({ authService, notificationService }));
  app.use('/api/reports', createReportRoutes({ authService, reportService }));
  app.use('/api/reservations', createReservationRoutes({ authService, reservationService }));
  app.use('/api/profile', createProfileRoutes({ authService, profileService }));
  app.use('/api/users', createUserManagementRoutes({ authService, userManagementService }));
  app.use('/api/books', createBookRoutes());
  app.use('/api/fines', createFineRoutes({ authService }));

  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found.',
      },
    });
  });

  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};



