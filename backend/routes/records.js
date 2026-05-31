const express = require('express');
const db = require('../database');
const alertService = require('../services/alerts');

const router = express.Router();

// Get patient's vital records
router.get('/patient/:userId', async (req, res) => {
  try {
    const records = await db.all(
      `SELECT * FROM vital_records WHERE user_id = ? ORDER BY recorded_date DESC`,
      [req.params.userId]
    );
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get records within date range
router.get('/patient/:userId/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const records = await db.all(
      `SELECT * FROM vital_records
       WHERE user_id = ? AND recorded_date BETWEEN ? AND ?
       ORDER BY recorded_date DESC`,
      [req.params.userId, startDate, endDate]
    );
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add vital record
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      systolic,
      diastolic,
      heart_rate,
      weight,
      dyspnea_level,
      edema_level,
      notes
    } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id required' });
    }

    const result = await db.run(
      `INSERT INTO vital_records (
        user_id, systolic, diastolic, heart_rate, weight,
        dyspnea_level, edema_level, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, systolic, diastolic, heart_rate, weight, dyspnea_level, edema_level, notes]
    );

    // Check for alerts
    await alertService.checkAndCreateAlerts(user_id, {
      systolic,
      diastolic,
      weight,
      dyspnea_level,
      edema_level
    });

    res.status(201).json({ id: result.lastID, message: 'Record created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get latest BNP records
router.get('/bnp/:userId', async (req, res) => {
  try {
    const bnpRecords = await db.all(
      'SELECT * FROM bnp_records WHERE user_id = ? ORDER BY recorded_date DESC LIMIT 20',
      [req.params.userId]
    );
    res.json(bnpRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add BNP record
router.post('/bnp', async (req, res) => {
  try {
    const { user_id, value } = req.body;

    if (!user_id || value === undefined) {
      return res.status(400).json({ error: 'user_id and value required' });
    }

    const result = await db.run(
      'INSERT INTO bnp_records (user_id, value) VALUES (?, ?)',
      [user_id, value]
    );

    // Check if BNP is high
    if (value > 400) {
      await db.run(
        `INSERT INTO alerts (user_id, type, severity, message)
         VALUES (?, 'high_bnp', 'high', 'BNP level elevated: ${value} pg/mL')`,
        [user_id]
      );
    }

    res.status(201).json({ id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
