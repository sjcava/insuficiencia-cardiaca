const { google } = require('googleapis');
const db = require('../database');

// Initialize Google Sheets credentials
const getAuthClient = async () => {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE,
        project_id: process.env.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID,
        private_key_id: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID,
        auth_uri: process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_URI,
        token_uri: process.env.GOOGLE_SERVICE_ACCOUNT_TOKEN_URI,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return auth;
  } catch (error) {
    console.error('❌ Google Auth error:', error);
    throw error;
  }
};

/**
 * Sync vital records to Google Sheets
 */
const syncVitalsToSheets = async () => {
  try {
    if (!process.env.GOOGLE_SHEETS_ID) {
      console.warn('⚠️  GOOGLE_SHEETS_ID not configured, skipping sync');
      return;
    }

    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Get unsynced records
    const records = await db.all(
      `SELECT vr.*, u.name, u.email FROM vital_records vr
       JOIN users u ON vr.user_id = u.id
       WHERE vr.synced_to_sheets = 0
       ORDER BY vr.recorded_date DESC LIMIT 100`
    );

    if (records.length === 0) {
      console.log('✅ No records to sync');
      return;
    }

    // Format data for Google Sheets
    const data = records.map(r => [
      r.name,
      r.email,
      r.recorded_date,
      r.systolic,
      r.diastolic,
      r.heart_rate,
      r.weight,
      r.dyspnea_level,
      r.edema_level,
      r.notes || ''
    ]);

    // Append to sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: process.env.GOOGLE_SHEETS_RANGE || 'Sheet1!A1',
      valueInputOption: 'RAW',
      resource: {
        values: data
      }
    });

    // Mark as synced
    const recordIds = records.map(r => r.id);
    for (const id of recordIds) {
      await db.run('UPDATE vital_records SET synced_to_sheets = 1 WHERE id = ?', [id]);
    }

    console.log(`✅ Synced ${records.length} records to Google Sheets`);
  } catch (error) {
    console.error('❌ Sync to sheets error:', error);
    throw error;
  }
};

/**
 * Sync data FROM Google Sheets to DB
 */
const syncFromSheets = async () => {
  try {
    if (!process.env.GOOGLE_SHEETS_ID) {
      console.warn('⚠️  GOOGLE_SHEETS_ID not configured, skipping sync');
      return;
    }

    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Read from sheets
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: process.env.GOOGLE_SHEETS_RANGE || 'Sheet1!A1:Z1000'
    });

    const rows = result.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data in Google Sheets');
      return;
    }

    console.log(`✅ Read ${rows.length} rows from Google Sheets`);
  } catch (error) {
    console.error('❌ Sync from sheets error:', error);
    throw error;
  }
};

/**
 * Set up automatic sync interval
 */
const setupAutoSync = (intervalMinutes = 30) => {
  const intervalMs = intervalMinutes * 60 * 1000;

  setInterval(async () => {
    try {
      await syncVitalsToSheets();
    } catch (error) {
      console.error('Auto-sync error:', error);
    }
  }, intervalMs);

  console.log(`📅 Auto-sync scheduled every ${intervalMinutes} minutes`);
};

module.exports = {
  syncVitalsToSheets,
  syncFromSheets,
  setupAutoSync
};
