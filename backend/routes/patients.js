const express = require('express');
const db = require('../database');

const router = express.Router();

// Get all patients (for doctors/monitors)
router.get('/', async (req, res) => {
  try {
    const patients = await db.all(
      'SELECT id, email, name, age, phone, condition_details FROM users WHERE role = "patient" ORDER BY name'
    );
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient details with latest vitals
router.get('/:id', async (req, res) => {
  try {
    const patient = await db.get(
      'SELECT * FROM users WHERE id = ? AND role = "patient"',
      [req.params.id]
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get latest vital records (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const vitals = await db.all(
      `SELECT * FROM vital_records
       WHERE user_id = ? AND recorded_date > ?
       ORDER BY recorded_date DESC LIMIT 30`,
      [req.params.id, thirtyDaysAgo]
    );

    // Get alerts
    const alerts = await db.all(
      'SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [req.params.id]
    );

    // Get medications
    const medications = await db.all(
      'SELECT * FROM medications WHERE user_id = ?',
      [req.params.id]
    );

    // Get surveys
    const surveys = await db.all(
      `SELECT s.*, u.name as nurse_name 
       FROM nurse_surveys s
       JOIN users u ON s.nurse_id = u.id
       WHERE s.user_id = ? 
       ORDER BY s.recorded_date DESC`,
      [req.params.id]
    );

    res.json({
      ...patient,
      vitals,
      alerts,
      medications,
      surveys,
      latestVital: vitals[0] || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search patients by name or email
router.get('/search/:query', async (req, res) => {
  try {
    const query = `%${req.params.query}%`;
    const patients = await db.all(
      `SELECT id, email, name, age, phone, condition_details FROM users
       WHERE role = "patient" AND (name LIKE ? OR email LIKE ?)
       ORDER BY name`,
      [query, query]
    );
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update patient info
router.put('/:id', async (req, res) => {
  try {
    const { name, age, phone, condition_details } = req.body;
    await db.run(
      'UPDATE users SET name = ?, age = ?, phone = ?, condition_details = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, age, phone, condition_details, req.params.id]
    );
    res.json({ message: 'Patient updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add medication to patient
router.post('/:id/medications', async (req, res) => {
  try {
    const { name, dosage, frequency } = req.body;
    await db.run(
      'INSERT INTO medications (user_id, name, dosage, frequency, start_date) VALUES (?, ?, ?, ?, DATE("now"))',
      [req.params.id, name, dosage, frequency]
    );
    res.status(201).json({ message: 'Medication added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
