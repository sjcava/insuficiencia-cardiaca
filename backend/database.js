const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'healthtech.db');
const dataDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('DB connection error:', err);
  else console.log(`Connected to SQLite at ${dbPath}`);
});

// Promisified db.run
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

// Promisified db.get
const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Promisified db.all
const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

const init = async () => {
  try {
    // Users table (patients, doctors, monitors)
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT CHECK(role IN ('patient', 'doctor', 'monitor')) NOT NULL,
        age INTEGER,
        phone TEXT,
        condition_details TEXT,
        next_contact_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add column if table already exists
    try {
      await run(`ALTER TABLE users ADD COLUMN next_contact_date DATE`);
    } catch (e) {
      // Column already exists, ignore
    }

    // Vital records table
    await run(`
      CREATE TABLE IF NOT EXISTS vital_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        systolic INTEGER,
        diastolic INTEGER,
        heart_rate INTEGER,
        weight REAL,
        dyspnea_level INTEGER CHECK(dyspnea_level BETWEEN 0 AND 4),
        edema_level INTEGER CHECK(edema_level BETWEEN 0 AND 3),
        notes TEXT,
        recorded_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_to_sheets INTEGER DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // Alerts table
    await run(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT CHECK(type IN ('high_pressure', 'high_bnp', 'weight_gain', 'dyspnea', 'edema', 'irregular_hr')) NOT NULL,
        severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
        message TEXT NOT NULL,
        read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // Nurse Surveys table
    await run(`
      CREATE TABLE IF NOT EXISTS nurse_surveys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        nurse_id INTEGER NOT NULL,
        vitals TEXT,
        symptoms TEXT,
        severity TEXT,
        improvement TEXT,
        control_status TEXT,
        notes TEXT,
        recorded_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(nurse_id) REFERENCES users(id)
      )
    `);

    // Patient Surveys table
    await run(`
      CREATE TABLE IF NOT EXISTS patient_surveys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        shortness_of_breath TEXT,
        swelling TEXT,
        weight_gain TEXT,
        kilos_gained REAL,
        fatigue TEXT,
        blood_pressure TEXT,
        normal_urination TEXT,
        loss_of_consciousness TEXT,
        recorded_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // BNP history table
    await run(`
      CREATE TABLE IF NOT EXISTS bnp_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        value REAL NOT NULL,
        recorded_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // Medications table
    await run(`
      CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        dosage TEXT,
        frequency TEXT,
        start_date DATE,
        end_date DATE,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // Create indexes for performance
    await run(`CREATE INDEX IF NOT EXISTS idx_vital_records_user_id ON vital_records(user_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_vital_records_recorded_date ON vital_records(recorded_date)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity)`);

    console.log('Database schema initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

module.exports = {
  db,
  run,
  get,
  all,
  init
};
