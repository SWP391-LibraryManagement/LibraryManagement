const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const { createAuthRoutes } = require('./routes/authRoutes');
const { createBorrowingRoutes } = require('./routes/borrowingRoutes');
const { createNotificationRoutes } = require('./routes/notificationRoutes');
const { createReportRoutes } = require('./routes/reportRoutes');
const { createReservationRoutes } = require('./routes/reservationRoutes');
const { createUserManagementRoutes } = require('./routes/userManagementRoutes');
const { createAdminBookRoutes, createBookRoutes } = require('./routes/bookRoutes');
const { createFineRoutes } = require('./routes/fineRoutes');
const { createProfileRoutes } = require('./routes/profileRoutes');
const { createAdminRoutes } = require('./routes/adminRoutes');
const { createInventoryRoutes } = require('./routes/inventoryRoutes');
const { createMembershipRoutes } = require('./routes/membershipRoutes');
const bookRoutes = require('./routes/bookRoutes');

const errorHandler = require('./middleware/errorHandler');
const { createHttpsEnforcementMiddleware } = require('./middleware/httpsEnforcement');
const { defaultAuthService } = require('./services/authService');
const { defaultBorrowingService } = require('./services/borrowingService');
const { defaultNotificationService } = require('./services/notificationService');
const { defaultReportService } = require('./services/reportService');
const { defaultReservationService } = require('./services/reservationService');
const { defaultProfileService } = require('./services/profileService');
const { defaultFineManagementService } = require('./services/fineManagementService');
const { defaultInventoryService } = require('./services/inventoryService');
const { createMembershipService } = require('./services/membershipService');
const { createUserManagementService } = require('./services/userManagementService');

function corsOptionsFromEnvironment() {
  if (process.env.NODE_ENV !== 'production') {
    return {};
  }

  const allowedOrigins = String(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    origin(origin, callback) {
      const allowed = !origin || allowedOrigins.includes(origin);
      return callback(null, allowed);
    },
  };
}

function createApp({
  authService = defaultAuthService,
  borrowingService = defaultBorrowingService,
  notificationService = defaultNotificationService,
  reportService = defaultReportService,
  reservationService = defaultReservationService,
  profileService = defaultProfileService,
  fineManagementService = defaultFineManagementService,
  inventoryService = defaultInventoryService,
  membershipService,
  userManagementService,
  adminService,
} = {}) {
  if (!membershipService) {
    const notificationRequester =
      typeof notificationService?.createSourceNotificationRequester === 'function'
        ? notificationService.createSourceNotificationRequester('FE04')
        : undefined;
    membershipService = createMembershipService({ notificationRequester });
  }

  if (!userManagementService) {
    const notificationRequester =
      typeof notificationService?.createSourceNotificationRequester === 'function'
        ? notificationService.createSourceNotificationRequester('FE11')
        : undefined;
    userManagementService = createUserManagementService({ notificationRequester });
  }

  const app = express();

  app.set('trust proxy', process.env.TRUST_PROXY === 'true');
  app.use(helmet());
  app.use(cors(corsOptionsFromEnvironment()));
  app.use(compression());
  // Reject or redirect auth transport before parsing credentials or dispatching auth routes.
  app.use(createHttpsEnforcementMiddleware());
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
  app.use('/api/membership', createMembershipRoutes({ authService, membershipService }));
  app.use('/api/users', createUserManagementRoutes({ authService, userManagementService }));
  app.use('/api/admin', createAdminRoutes({ authService, adminService }));
  app.use('/api', createInventoryRoutes({ authService, inventoryService }));
  app.use('/api/books', createBookRoutes({ authService }));
  app.use('/api/admin/books', createAdminBookRoutes({ authService }));
  app.use('/api/fines', createFineRoutes({ authService, fineManagementService }));

  // API docs (Swagger UI). Optional: skip silently if the spec file is missing/invalid.
  try {
    const openapiDocument = YAML.load(path.resolve(__dirname, 'docs/openapi.yaml'));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
  } catch (err) {
    // OpenAPI spec not available — continue without the docs UI.
  }

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



