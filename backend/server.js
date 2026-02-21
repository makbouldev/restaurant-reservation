const express = require('express');
const cors = require('cors');
const path = require('path');

const menuRoutes = require('./routes/menuRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const adminSettingsRoutes = require('./routes/adminSettingsRoutes');
const { initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api', (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    'Surrogate-Control': 'no-store'
  });
  next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'Surrogate-Control': 'no-store'
    });
  }
}));

app.get('/', (req, res) => {
  res.json({
    app: 'NeonBite API',
    status: 'running',
    endpoints: ['/api/menu', '/api/menu/categories', '/api/specials', '/api/reservations', '/api/comments']
  });
});

app.use('/api', menuRoutes);
app.use('/api', reservationRoutes);
app.use('/api', adminAuthRoutes);
app.use('/api', adminSettingsRoutes);

app.use((error, req, res, next) => {
  if (error && error.message) {
    return res.status(400).json({ message: error.message });
  }
  return next();
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database init failed:', error.message);
    process.exit(1);
  });
