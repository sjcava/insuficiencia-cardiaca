const express = require('express');
const db = require('../database');

const router = express.Router();

// Get alerts for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { read } = req.query;
    let query = 'SELECT * FROM alerts WHERE user_id = ?';
    const params = [req.params.userId];

    if (read !== undefined) {
      query += ' AND read = ?';
      params.push(read === 'true' ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const alerts = await db.all(query, params);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread alerts for a user
router.get('/user/:userId/unread', async (req, res) => {
  try {
    const alerts = await db.all(
      'SELECT * FROM alerts WHERE user_id = ? AND read = 0 ORDER BY severity DESC, created_at DESC',
      [req.params.userId]
    );
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all critical alerts (for dashboard)
router.get('/critical', async (req, res) => {
  try {
    const alerts = await db.all(
      `SELECT a.*, u.name FROM alerts a
       JOIN users u ON a.user_id = u.id
       WHERE a.severity IN ('critical', 'high') AND a.read = 0
       ORDER BY a.created_at DESC LIMIT 20`
    );
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark alert as read
router.put('/:alertId/read', async (req, res) => {
  try {
    await db.run(
      'UPDATE alerts SET read = 1 WHERE id = ?',
      [req.params.alertId]
    );
    res.json({ message: 'Alert marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all alerts as read for a user
router.put('/user/:userId/read-all', async (req, res) => {
  try {
    await db.run(
      'UPDATE alerts SET read = 1 WHERE user_id = ?',
      [req.params.userId]
    );
    res.json({ message: 'All alerts marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
