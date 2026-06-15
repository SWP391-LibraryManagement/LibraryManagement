const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
  quiet: true,
});

const { createApp } = require('./app');

const app = createApp();

const port = Number(process.env.PORT || 3000);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Backend server listening on http://localhost:${port}`);
  });
}

module.exports = app;
