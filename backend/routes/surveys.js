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
      notes,
      is_decompensated
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

    if (is_decompensated) {
      await db.run(
        `INSERT INTO alerts (user_id, type, severity, message) VALUES (?, ?, ?, ?)`,
        [user_id, 'dyspnea', 'critical', 'Paciente descompensado (Detectado en Telemonitoreo)']
      );
    }

    res.status(201).json({ id: result.lastID, message: 'Survey saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PATIENT SELF-SURVEYS ====================

// Get all patient surveys (for nurses)
router.get('/patient-survey/all', async (req, res) => {
  try {
    const surveys = await db.all(
      `SELECT s.*, u.name as patient_name 
       FROM patient_surveys s
       JOIN users u ON s.user_id = u.id
       ORDER BY s.recorded_date DESC`
    );
    res.json(surveys);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Patient fills out their daily survey
router.post('/patient-survey', async (req, res) => {
  try {
    const {
      user_id,
      shortness_of_breath,
      swelling,
      weight_gain,
      kilos_gained,
      fatigue,
      blood_pressure,
      normal_urination,
      loss_of_consciousness
    } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id required' });
    }

    const result = await db.run(
      `INSERT INTO patient_surveys (
        user_id, shortness_of_breath, swelling, weight_gain, kilos_gained, 
        fatigue, blood_pressure, normal_urination, loss_of_consciousness
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, shortness_of_breath, swelling, weight_gain, kilos_gained, fatigue, blood_pressure, normal_urination, loss_of_consciousness]
    );

    // Alert generation logic
    if (loss_of_consciousness === 'Sí' || shortness_of_breath === 'Sí') {
      await db.run(
        `INSERT INTO alerts (user_id, type, severity, message) VALUES (?, ?, ?, ?)`,
        [user_id, 'dyspnea', 'critical', 'Paciente reporta síntomas graves (Pérdida de consciencia / Falta de aire)']
      );
    } else if (weight_gain === 'Sí' && kilos_gained > 1.5) {
      await db.run(
        `INSERT INTO alerts (user_id, type, severity, message) VALUES (?, ?, ?, ?)`,
        [user_id, 'weight_gain', 'high', `Aumento de peso considerable (${kilos_gained} kg)`]
      );
    } else if (swelling === 'Sí') {
      await db.run(
        `INSERT INTO alerts (user_id, type, severity, message) VALUES (?, ?, ?, ?)`,
        [user_id, 'edema', 'high', 'Paciente reporta hinchazón']
      );
    }

    res.status(201).json({ id: result.lastID, message: 'Patient survey saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
