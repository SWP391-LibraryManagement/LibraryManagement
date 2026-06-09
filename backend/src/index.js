const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
require('dotenv').config();

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

const port = Number(process.env.PORT || 3000);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Backend server listening on http://localhost:${port}`);
  });
}

module.exports = app;