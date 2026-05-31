const db = require('../backend/database');
const bcrypt = require('bcryptjs');

const SEED_DATA = {
  // Mock patients with cardiac conditions
  patients: [
    {
      email: 'paciente@mail.com',
      password: 'password123',
      name: 'Juan García López',
      role: 'patient',
      age: 68,
      phone: '+34 612 345 678',
      condition_details: 'Heart failure, NYHA Class II, hypertension'
    },
    {
      email: 'maria.rodriguez@example.com',
      password: 'password123',
      name: 'María Rodríguez Martín',
      role: 'patient',
      age: 72,
      phone: '+34 623 456 789',
      condition_details: 'Systolic heart failure, arrhythmia history'
    },
    {
      email: 'carlos.fernandez@example.com',
      password: 'password123',
      name: 'Carlos Fernández García',
      role: 'patient',
      age: 65,
      phone: '+34 634 567 890',
      condition_details: 'Preserved ejection fraction HF, diabetes'
    },
    {
      email: 'ana.moreno@example.com',
      password: 'password123',
      name: 'Ana Moreno Sánchez',
      role: 'patient',
      age: 70,
      phone: '+34 645 678 901',
      condition_details: 'Acute decompensated HF, recent hospitalization'
    },
    {
      email: 'luis.torres@example.com',
      password: 'password123',
      name: 'Luis Torres Gómez',
      role: 'patient',
      age: 66,
      phone: '+34 656 789 012',
      condition_details: 'Heart failure with reduced EF, chronic kidney disease'
    }
  ],

  // Mock doctors
  doctors: [
    {
      email: 'medico@cmdlt.com',
      password: 'password123',
      name: 'Dr. Francisco Sánchez',
      role: 'doctor',
      age: 55,
      phone: '+34 667 890 123',
      condition_details: 'Cardiologist, UCI Head'
    },
    {
      email: 'dr.martinez@hospital.com',
      password: 'password123',
      name: 'Dr. Isabel Martínez',
      role: 'doctor',
      age: 48,
      phone: '+34 678 901 234',
      condition_details: 'Cardiologist, Heart Failure Specialist'
    }
  ],

  // Mock monitors/nurses
  monitors: [
    {
      email: 'enfermera@cmdlt.com',
      password: 'password123',
      name: 'Elena Ruiz (Nurse)',
      role: 'monitor',
      age: 42,
      phone: '+34 689 012 345',
      condition_details: 'Clinical Nurse, UCI'
    },
    {
      email: 'nurse.sofia@hospital.com',
      password: 'password123',
      name: 'Sofía López (Nurse)',
      role: 'monitor',
      age: 39,
      phone: '+34 690 123 456',
      condition_details: 'Clinical Nurse, UCI'
    }
  ]
};

// Generate realistic vital records for a patient
const generateVitalRecords = (userId, days = 30) => {
  const records = [];
  const now = Date.now();

  // Simulate realistic vital patterns
  const baseValues = {
    systolic: 130 + Math.random() * 30,
    diastolic: 75 + Math.random() * 20,
    heart_rate: 70 + Math.random() * 30,
    weight: 80 + Math.random() * 10
  };

  for (let i = days; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    const timeStr = date.toISOString();

    // Add some variability
    const dailyVariability = Math.sin(i / 7) * 10; // Weekly pattern

    // Alert-triggering scenarios (25% chance)
    const shouldAlert = Math.random() < 0.25;

    records.push({
      user_id: userId,
      systolic: Math.round(baseValues.systolic + dailyVariability + (shouldAlert ? 20 : 0)),
      diastolic: Math.round(baseValues.diastolic + dailyVariability * 0.7 + (shouldAlert ? 10 : 0)),
      heart_rate: Math.round(baseValues.heart_rate + dailyVariability * 0.8),
      weight: parseFloat((baseValues.weight + dailyVariability * 0.05).toFixed(1)),
      dyspnea_level: shouldAlert ? Math.floor(Math.random() * 2) + 2 : Math.floor(Math.random() * 2),
      edema_level: shouldAlert ? 1 + Math.floor(Math.random() * 2) : Math.floor(Math.random() * 1),
      notes: shouldAlert ? 'Symptomatic episode' : 'Routine measurement',
      recorded_date: timeStr
    });
  }

  return records;
};

// Generate BNP records
const generateBNPRecords = (userId, count = 8) => {
  const records = [];
  const now = Date.now();
  const interval = 90 * 24 * 60 * 60 * 1000; // Every 90 days

  for (let i = count; i >= 0; i--) {
    const date = new Date(now - i * interval);

    // BNP values: normal < 100, elevated 100-400, high > 400
    const baseBNP = 150 + Math.random() * 300;

    records.push({
      user_id: userId,
      value: Math.round(baseBNP),
      recorded_date: date.toISOString()
    });
  }

  return records;
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Checking database status...\n');
    await db.init();

    // Check if we need to seed
    const existingUsers = await db.all("SELECT id FROM users LIMIT 1");
    if (existingUsers.length > 0) {
      console.log('✅ Database is already seeded. Skipping seed process.');
      db.db.close((err) => {
        if (err) console.error(err);
        process.exit(0);
      });
      return;
    }
    
    console.log('🌱 Seeding database with demo data...\n');
    
    // Create all users and collect their IDs
    let patientIds = [];
    let doctorIds = [];
    let monitorIds = [];

    // Insert patients
    for (const patient of SEED_DATA.patients) {
      const hashedPassword = await bcrypt.hash(patient.password, 10);
      const result = await db.run(
        `INSERT INTO users (email, password, name, role, age, phone, condition_details)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          patient.email,
          hashedPassword,
          patient.name,
          patient.role,
          patient.age,
          patient.phone,
          patient.condition_details
        ]
      );
      patientIds.push(result.lastID);
      console.log(`✅ Created patient: ${patient.name}`);
    }

    // Insert doctors
    for (const doctor of SEED_DATA.doctors) {
      const hashedPassword = await bcrypt.hash(doctor.password, 10);
      const result = await db.run(
        `INSERT INTO users (email, password, name, role, age, phone, condition_details)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          doctor.email,
          hashedPassword,
          doctor.name,
          doctor.role,
          doctor.age,
          doctor.phone,
          doctor.condition_details
        ]
      );
      doctorIds.push(result.lastID);
      console.log(`✅ Created doctor: ${doctor.name}`);
    }

    // Insert monitors
    for (const monitor of SEED_DATA.monitors) {
      const hashedPassword = await bcrypt.hash(monitor.password, 10);
      const result = await db.run(
        `INSERT INTO users (email, password, name, role, age, phone, condition_details)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          monitor.email,
          hashedPassword,
          monitor.name,
          monitor.role,
          monitor.age,
          monitor.phone,
          monitor.condition_details
        ]
      );
      monitorIds.push(result.lastID);
      console.log(`✅ Created monitor: ${monitor.name}`);
    }

    console.log('\n📊 Generating vital records...\n');

    // Generate vital records for each patient
    for (let i = 0; i < patientIds.length; i++) {
      const patientId = patientIds[i];
      const records = generateVitalRecords(patientId, 30);

      for (const record of records) {
        await db.run(
          `INSERT INTO vital_records
           (user_id, systolic, diastolic, heart_rate, weight, dyspnea_level, edema_level, notes, recorded_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            record.user_id,
            record.systolic,
            record.diastolic,
            record.heart_rate,
            record.weight,
            record.dyspnea_level,
            record.edema_level,
            record.notes,
            record.recorded_date
          ]
        );
      }

      console.log(`✅ Created ${records.length} vital records for patient ${i + 1}/5`);
    }

    console.log('\n🩺 Generating BNP records...\n');

    // Generate BNP records
    for (let i = 0; i < patientIds.length; i++) {
      const patientId = patientIds[i];
      const bnpRecords = generateBNPRecords(patientId, 5);

      for (const record of bnpRecords) {
        await db.run(
          `INSERT INTO bnp_records (user_id, value, recorded_date)
           VALUES (?, ?, ?)`,
          [record.user_id, record.value, record.recorded_date]
        );
      }

      console.log(`✅ Created ${bnpRecords.length} BNP records for patient ${i + 1}/5`);
    }

    console.log('\n💊 Adding sample medications...\n');

    // Add sample medications
    const medications = [
      { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
      { name: 'Furosemide', dosage: '40mg', frequency: 'Twice daily' },
      { name: 'Carvedilol', dosage: '25mg', frequency: 'Twice daily' },
      { name: 'Spironolactone', dosage: '25mg', frequency: 'Once daily' },
      { name: 'Atorvastatin', dosage: '80mg', frequency: 'Once daily' }
    ];

    for (const patientId of patientIds) {
      // Each patient gets 3-4 random medications
      const medicationCount = 3 + Math.floor(Math.random() * 2);
      for (let i = 0; i < medicationCount; i++) {
        const med = medications[Math.floor(Math.random() * medications.length)];
        const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        await db.run(
          `INSERT INTO medications (user_id, name, dosage, frequency, start_date)
           VALUES (?, ?, ?, ?, ?)`,
          [patientId, med.name, med.dosage, med.frequency, startDate]
        );
      }
    }

    console.log(`✅ Added medications for all patients`);

    console.log('\n🎉 Database seedin