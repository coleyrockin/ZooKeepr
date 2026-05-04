const express = require('express');
const helmet = require('helmet');

const PORT = process.env.PORT || 3001;
const app = express();
const apiRoutes = require('./routes/apiRoutes');
const htmlRoutes = require('./routes/htmlRoutes');

app.use(helmet());
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.json({ limit: '16kb' }));
app.use(express.static('public'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'zookeepr', env: process.env.NODE_ENV || 'development' });
});

app.use('/api', apiRoutes);
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});
app.use('/', htmlRoutes);

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err);
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(500).json({ error: 'An unexpected server error occurred.' });
  }

  return res.status(500).json({ error: 'An unexpected server error occurred.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ZooKeepr server now on port ${PORT}!`);
  });
}

module.exports = app;
