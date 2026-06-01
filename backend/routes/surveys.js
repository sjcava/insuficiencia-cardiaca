const express = require('express');
const db = require('../database');

const router = express.Router();

// Get surveys for a specific patient
router.get('/patient/:userId', async (req, res) => {
  try {
    const surveys = await db.all(
      `SELECT s.*, u.name as nurse_name 
       FROM nurse_surveys s
       JOIN users u ON s.nurse_id = u.id
       WHERE s.user_id = ? 
       ORDER BY s.recorded_date DESC`,
      [req.params.userId]
    );
    res.json(surveys);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new telemonitoring survey
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      nurse_id,
      vitals,
      symptoms,
      severity,
      improvement,
      control_status,
      notes
    } = req.body;

    if (!user_id || !nurse_id) {
      return res.status(400).json({ error: 'user_id and nurse_id required' });
    }

    const result = await db.run(
      `INSERT INTO nurse_surveys (
        user_id, nurse_id, vitals, symptoms, severity, improvement, control_status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, nurse_id, vitals, symptoms, severity, improvement, control_status, notes]
    );

    res.status(201).json({ id: result.lastID, message: 'Survey saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
