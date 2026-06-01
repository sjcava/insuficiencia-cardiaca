const db = require('../database');

// Clinical alert thresholds
const THRESHOLDS = {
  systolicHigh: 140,
  diastolicHigh: 90,
  weightGainKg: 3,
  dyspnea: 3, // moderate to severe
  edema: 2,   // moderate to severe
  bnp: 400,
  hrHigh: 100,
  hrIrregular: true
};

/**
 * Check vitals and create alerts if thresholds exceeded
 */
const checkAndCreateAlerts = async (userId, vitals) => {
  const alerts = [];

  // Systolic/Diastolic check
  if (vitals.systolic && vitals.systolic > THRESHOLDS.systolicHigh) {
    alerts.push({
      type: 'high_pressure',
      severity: vitals.systolic > 160 ? 'critical' : 'high',
      message: `Tensión sistólica alta: ${vitals.systolic} mmHg`
    });
  }

  if (vitals.diastolic && vitals.diastolic > THRESHOLDS.diastolicHigh) {
    alerts.push({
      type: 'high_pressure',
      severity: vitals.diastolic > 100 ? 'critical' : 'high',
      message: `Tensión diastólica alta: ${vitals.diastolic} mmHg`
    });
  }

  // Dyspnea check
  if (vitals.dyspnea_level >= THRESHOLDS.dyspnea) {
    alerts.push({
      type: 'dyspnea',
      severity: vitals.dyspnea_level === 4 ? 'critical' : 'high',
      message: `Nivel de disnea: ${vitals.dyspnea_level}/4 - Dificultad respiratoria`
    });
  }

  // Edema check
  if (vitals.edema_level >= THRESHOLDS.edema) {
    alerts.push({
      type: 'edema',
      severity: 'high',
      message: `Nivel de edema: ${vitals.edema_level}/3 - Retención de líquidos`
    });
  }

  // Weight gain check
  if (vitals.weight) {
    try {
      // Get previous weight from 7 days ago
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const prevWeight = await db.get(
        `SELECT weight FROM vital_records
         WHERE user_id = ? AND recorded_date > ? AND weight IS NOT NULL
         ORDER BY recorded_date ASC LIMIT 1`,
        [userId, sevenDaysAgo]
      );

      if (prevWeight && (vitals.weight - prevWeight.weight) >= THRESHOLDS.weightGainKg) {
        alerts.push({
          type: 'weight_gain',
          severity: 'high',
          message: `Alerta de aumento de peso: +${(vitals.weight - prevWeight.weight).toFixed(1)} kg en 7 días`
        });
      }
    } catch (error) {
      console.error('Weight check error:', error);
    }
  }

  // Heart rate check
  if (vitals.heart_rate && vitals.heart_rate > THRESHOLDS.hrHigh) {
    alerts.push({
      type: 'irregular_hr',
      severity: vitals.heart_rate > 120 ? 'high' : 'medium',
      message: `Frecuencia cardíaca alta: ${vitals.heart_rate} lpm`
    });
  }

  // Create alerts in database
  for (const alert of alerts) {
    try {
      await db.run(
        `INSERT INTO alerts (user_id, type, severity, message)
         VALUES (?, ?, ?, ?)`,
        [userId, alert.type, alert.severity, alert.message]
      );
    } catch (error) {
      console.error('Alert creation error:', error);
    }
  }

  return alerts;
};

/**
 * Get patient risk score based on recent vitals
 */
const calculateRiskScore = async (userId) => {
  try {
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();

    const vitals = await db.all(
      `SELECT * FROM vital_records
       WHERE user_id = ? AND recorded_date > ?
       ORDER BY recorded_date DESC`,
      [userId, fifteenDaysAgo]
    );

    if (vitals.length === 0) return 0;

    let riskScore = 0;
    const recentVital = vitals[0];

    // Pressure risk
    if (recentVital.systolic > 160 || recentVital.diastolic > 100) {
      riskScore += 3;
    } else if (recentVital.systolic > 140 || recentVital.diastolic > 90) {
      riskScore += 2;
    } else if (recentVital.systolic > 130 || recentVital.diastolic > 80) {
      riskScore += 1;
    }

    // Dyspnea risk
    if (recentVital.dyspnea_level >= 3) riskScore += 3;
    else if (recentVital.dyspnea_level >= 2) riskScore += 2;
    else if (recentVital.dyspnea_level >= 1) riskScore += 1;

    // Edema risk
    if (recentVital.edema_level >= 2) riskScore += 2;
    else if (recentVital.edema_level === 1) riskScore += 1;

    // Weight trend
    if (vitals.length > 1) {
      const weightGain = vitals[vitals.length - 1].weight - recentVital.weight;
      if (weightGain > 2) riskScore += 2;
      else if (weightGain > 0.5) riskScore += 1;
    }

    // Heart rate
    if (recentVital.heart_rate > 120) riskScore += 2;
    else if (recentVital.heart_rate > 100) riskScore += 1;

    return Math.min(riskScore, 10); // Max 10
  } catch (error) {
    console.error('Risk score calculation error:', error);
    return 0;
  }
};

/**
 * Get alert summary for dashboard
 */
const getAlertSummary = async (userId) => {
  try {
    const summary = await db.get(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN read = 0 THEN 1 ELSE 0 END) as unread
      FROM alerts WHERE user_id = ?`,
      [userId]
    );
    return summary || { total: 0, critical: 0, high: 0, medium: 0, unread: 0 };
  } catch (error) {
    console.error('Alert summary error:', error);
    return { total: 0, critical: 0, high: 0, medium: 0, unread: 0 };
  }
};

module.exports = {
  checkAndCreateAlerts,
  calculateRiskScore,
  getAlertSummary,
  THRESHOLDS
};
