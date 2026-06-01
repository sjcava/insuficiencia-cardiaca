const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const db = require('./backend/database');
const authRoutes = require('./backend/routes/auth');
const patientRoutes = require('./backend/routes/patients');
const recordRoutes = require('./backend/routes/records');
const alertRoutes = require('./backend/routes/alerts');
const surveyRoutes = require('./backend/routes/surveys');
const sheetsSync = require('./backend/services/google-sheets');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database
db.init().then(() => {
  console.log('Database initialized');
}).catch(err => {
  console.error('Database init error:', err);
  process.exit(1);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/surveys', surveyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Sync Google Sheets (optional endpoint)
app.post('/api/sync-sheets', async (req, res) => {
  try {
    await sheetsSync.syncFromSheets();
    res.json({ message: 'Sync successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Frontend catch-all (for SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 HealthTech Server running on http://localhost:${PORT}`);
});
