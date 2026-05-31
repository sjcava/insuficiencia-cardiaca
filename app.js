// API Base URL
const API_URL = window.location.origin + '/api';

// Global state
let currentUser = null;
let currentPatient = null;
let patients = [];
let alerts = [];

// ==================== Auth ====================

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('login-error');

  errorDiv.textContent = '';

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Email o contraseña inválidos');
    }

    const data = await response.json();
    currentUser = data.user;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Route to appropriate dashboard
    showDashboard(data.user.role);
  } catch (error) {
    errorDiv.textContent = error.message;
  }
}

function setDemoLogin(email, password) {
  document.getElementById('email').value = email;
  document.getElementById('password').value = password;
  handleLogin(new Event('submit'));
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentUser = null;
  currentPatient = null;
  showLoginScreen();
}

function showLoginScreen() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('login-screen').classList.add('active');
}

function showDashboard(role) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  if (role === 'doctor') {
    document.getElementById('doctor-screen').classList.add('active');
    document.getElementById('user-name').textContent = currentUser.name;
    loadDoctorDashboard();
  } else if (role === 'patient') {
    document.getElementById('patient-screen').classList.add('active');
    document.getElementById('patient-user-name').textContent = currentUser.name;
    loadPatientDashboard();
  } else if (role === 'monitor') {
    document.getElementById('monitor-screen').classList.add('active');
    document.getElementById('monitor-user-name').textContent = currentUser.name;
    loadMonitorDashboard();
  }
}

// ==================== Doctor Dashboard ====================

async function loadDoctorDashboard() {
  try {
    const response = await fetch(`${API_URL}/patients`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    patients = await response.json();

    // Load alerts
    const alertsResponse = await fetch(`${API_URL}/alerts/critical`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    alerts = await alertsResponse.json();

    // Update dashboard
    document.getElementById('total-patients').textContent = patients.length;
    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const highCount = alerts.filter(a => a.severity === 'high').length;

    document.getElementById('critical-alerts').textContent = criticalCount;
    document.getElementById('high-alerts').textContent = highCount;

    // Display recent alerts
    const alertsHtml = alerts.slice(0, 10).map(a => `
      <div class="alert ${a.severity}">
        <div class="alert-content">
          <div class="alert-title">${a.message}</div>
          <div class="alert-message">Paciente: ${a.name || 'Unknown'} • ${new Date(a.created_at).toLocaleString('es-ES')}</div>
        </div>
        <button class="alert-close" onclick="markAlertRead(${a.id})">×</button>
      </div>
    `).join('');

    document.getElementById('recent-alerts-container').innerHTML = alertsHtml || '<p style="color: #6b6b6b;">Sin alertas críticas</p>';

    // Load patients list
    loadPatientsList();
  } catch (error) {
    console.error('Error loading doctor dashboard:', error);
  }
}

function loadPatientsList() {
  const tbody = document.getElementById('patients-tbody');
  tbody.innerHTML = patients.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${p.email}</td>
      <td>${p.age || '-'}</td>
      <td>${p.phone || '-'}</td>
      <td>
        <button class="btn-secondary" onclick="viewPatientDetail(${p.id})">Ver Detalles</button>
      </td>
    </tr>
  `).join('');
}

async function searchPatients() {
  const query = document.getElementById('patient-search').value;
  if (!query) {
    loadPatientsList();
    return;
  }

  try {
    const response = await fetch(`${API_URL}/patients/search/${query}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const results = await response.json();

    const tbody = document.getElementById('patients-tbody');
    tbody.innerHTML = results.map(p => `
      <tr>
        <td>${p.name}</td>
        <td>${p.email}</td>
        <td>${p.age || '-'}</td>
        <td>${p.phone || '-'}</td>
        <td>
          <button class="btn-secondary" onclick="viewPatientDetail(${p.id})">Ver Detalles</button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Search error:', error);
  }
}

async function viewPatientDetail(patientId) {
  try {
    const response = await fetch(`${API_URL}/patients/${patientId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    currentPatient = await response.json();

    // Update modal
    document.getElementById('patient-detail-name').textContent = currentPatient.name;
    document.getElementById('patient-detail-condition').textContent = currentPatient.condition_details;

    const vitalsHtml = (currentPatient.vitals || []).slice(0, 5).map(v => `
      <div style="padding: 12px; background: #f9f9f9; border-radius: 6px; margin-bottom: 8px;">
        <div style="font-weight: 500;">${new Date(v.recorded_date).toLocaleString('es-ES')}</div>
        <div style="font-size: 13px; color: #6b6b6b;">
          PA: ${v.systolic}/${v.diastolic} mmHg | FC: ${v.heart_rate} lpm | Peso: ${v.weight} kg
        </div>
      </div>
    `).join('');

    document.getElementById('patient-vitals-detail').innerHTML = vitalsHtml || '<p style="color: #6b6b6b;">Sin registros</p>';

    const alertsHtml = (currentPatient.alerts || []).slice(0, 5).map(a => `
      <div class="alert ${a.severity}">
        <div class="alert-content">
          <div class="alert-title">${a.message}</div>
          <div class="alert-message">${new Date(a.created_at).toLocaleString('es-ES')}</div>
        </div>
      </div>
    `).join('');

    document.getElementById('patient-alerts-detail').innerHTML = alertsHtml || '<p style="color: #6b6b6b;">Sin alertas</p>';

    document.getElementById('patient-detail-modal').classList.add('active');
  } catch (error) {
    console.error('Error loading patient detail:', error);
  }
}

function closePatientDetail() {
  document.getElementById('patient-detail-modal').classList.remove('active');
}

async function markAlertRead(alertId) {
  try {
    await fetch(`${API_URL}/alerts/${alertId}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    loadDoctorDashboard();
  } catch (error) {
    console.error('Error marking alert as read:', error);
  }
}

function switchView(viewName) {
  document.querySelectorAll('.view-content').forEach(v => v.style.display = 'none');
  document.getElementById(viewName).style.display = 'block';

  document.querySelectorAll('.sidebar-menu button').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

// ==================== Patient Dashboard ====================

async function loadPatientDashboard() {
  try {
    const response = await fetch(`${API_URL}/patients/${currentUser.id}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const patientData = await response.json();
    currentPatient = patientData;

    // Update latest vitals
    if (patientData.latestVital) {
      const v = patientData.latestVital;
      document.getElementById('latest-systolic').textContent = v.systolic || '-';
      document.getElementById('latest-diastolic').textContent = v.diastolic || '-';
      document.getElementById('latest-hr').textContent = v.heart_rate || '-';
      document.getElementById('latest-weight').textContent = v.weight || '-';
    }

    // Display alerts
    const alertsHtml = (patientData.alerts || []).slice(0, 5).map(a => `
      <div class="alert ${a.severity}">
        <div class="alert-content">
          <div class="alert-title">${a.message}</div>
          <div class="alert-message">${new Date(a.created_at).toLocaleString('es-ES')}</div>
        </div>
        <button class="alert-close" onclick="markPatientAlertRead(${a.id})">×</button>
      </div>
    `).join('');

    document.getElementById('patient-alerts-container').innerHTML = alertsHtml || '<p style="color: #6b6b6b;">Sin alertas activas</p>';

    // Load history
    loadPatientHistory();
  } catch (error) {
    console.error('Error loading patient dashboard:', error);
  }
}

async function loadPatientHistory() {
  try {
    const response = await fetch(`${API_URL}/records/patient/${currentUser.id}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const records = await response.json();

    const tbody = document.getElementById('history-tbody');
    tbody.innerHTML = records.slice(0, 20).map(r => `
      <tr>
        <td>${new Date(r.recorded_date).toLocaleString('es-ES')}</td>
        <td>${r.systolic}/${r.diastolic}</td>
        <td>${r.heart_rate}</td>
        <td>${r.weight}</td>
        <td>${r.dyspnea_level}</td>
        <td>${r.edema_level}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading history:', error);
  }
}

async function submitVitalRecord(event) {
  event.preventDefault();

  const record = {
    user_id: currentUser.id,
    systolic: parseInt(document.getElementById('record-systolic').value),
    diastolic: parseInt(document.getElementById('record-diastolic').value),
    heart_rate: parseInt(document.getElementById('record-hr').value),
    weight: parseFloat(document.getElementById('record-weight').value),
    dyspnea_level: parseInt(document.getElementById('record-dyspnea').value),
    edema_level: parseInt(document.getElementById('record-edema').value),
    notes: document.getElementById('record-notes').value
  };

  try {
    const response = await fetch(`${API_URL}/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(record)
    });

    if (response.ok) {
      document.getElementById('record-message').textContent = '✅ Registro guardado correctamente';
      document.getElementById('record-message').style.color = '#17A34A';

      // Reset form
      document.getElementById('record-form').reset();

      // Reload dashboard
      setTimeout(loadPatientDashboard, 1000);
    }
  } catch (error) {
    document.getElementById('record-message').textContent = '❌ Error al guardar el registro';
    document.getElementById('record-message').style.color = '#dc2626';
  }
}

async function markPatientAlertRead(alertId) {
  try {
    await fetch(`${API_URL}/alerts/${alertId}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    loadPatientDashboard();
  } catch (error) {
    console.error('Error:', error);
  }
}

function switchPatientView(viewName) {
  document.querySelectorAll('#patient-screen .view-content').forEach(v => v.style.display = 'none');
  document.getElementById(viewName).style.display = 'block';

  document.querySelectorAll('#patient-screen .sidebar-menu button').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

// ==================== Monitor Dashboard ====================

async function loadMonitorDashboard() {
  try {
    const response = await fetch(`${API_URL}/patients`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    patients = await response.json();

    const html = patients.map(p => `
      <div style="padding: 16px; border: 1px solid #e5e5e5; border-radius: 8px; margin-bottom: 12px;">
        <div style="font-weight: 500;">${p.name}</div>
        <div style="font-size: 13px; color: #6b6b6b; margin-top: 4px;">
          Email: ${p.email} | Edad: ${p.age || '-'}
        </div>
      </div>
    `).join('');

    document.getElementById('monitor-patients-list').innerHTML = html;
  } catch (error) {
    console.error('Error:', error);
  }
}

async function loadMonitorAlerts() {
  try {
    const response = await fetch(`${API_URL}/alerts/critical`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const alerts = await response.json();

    const html = alerts.map(a => `
      <div class="alert ${a.severity}">
        <div class="alert-content">
          <div class="alert-title">${a.message}</div>
          <div class="alert-message">Paciente: ${a.name} • ${new Date(a.created_at).toLocaleString('es-ES')}</div>
        </div>
      </div>
    `).join('');

    document.getElementById('monitor-alerts-container').innerHTML = html || '<p style="color: #6b6b6b;">Sin alertas</p>';
  } catch (error) {
    console.error('Error:', error);
  }
}

function switchMonitorView(viewName) {
  document.querySelectorAll('#monitor-screen .view-content').forEach(v => v.style.display = 'none');
  document.getElementById(viewName).style.display = 'block';

  if (viewName === 'monitor-alerts') {
    loadMonitorAlerts();
  }

  document.querySelectorAll('#monitor-screen .sidebar-menu button').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

// ==================== Init ====================

window.addEventListener('load', () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (token && user) {
    currentUser = JSON.parse(user);
    showDashboard(currentUser.role);
  } else {
    showLoginScreen();
  }
});
