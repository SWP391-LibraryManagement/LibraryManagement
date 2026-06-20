const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');

const { createAuthRoutes } = require('./routes/authRoutes');
const { createUserManagementRoutes } = require('./routes/userManagementRoutes');
const { createProfileRoutes } = require('./routes/profileRoutes');
const bookRoutes = require('./routes/bookRoutes');

const errorHandler = require('./middleware/errorHandler');
const { defaultAuthService } = require('./services/authService');

function createApp({ authService = defaultAuthService, userManagementService, profileService } = {}) {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json());

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
  app.use('/api/profile', createProfileRoutes({ authService, profileService }));
  app.use('/api/users', createUserManagementRoutes({ authService, userManagementService }));

  app.use('/api/books', bookRoutes);

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
