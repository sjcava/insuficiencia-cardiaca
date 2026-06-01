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
    document.getElementById('critical-alerts-container').innerHTML = alertsHtml || '<p style="color: #6b6b6b;">Sin alertas críticas</p>';

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
        <button class="btn-secondary" onclick="viewPatientDetail(${p.id})">Historia Clínica</button>
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
          <button class="btn-secondary" onclick="viewPatientDetail(${p.id})">Historia Clínica</button>
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

    const surveysHtml = (currentPatient.surveys || []).map(s => `
      <div style="padding: 12px; border: 1px solid #e5e5e5; border-radius: 6px; margin-bottom: 8px;">
        <div style="font-weight: 500; display: flex; justify-content: space-between;">
          <span>📞 Evaluado por: ${s.nurse_name}</span>
          <span style="color: #6b6b6b; font-size: 12px;">${new Date(s.recorded_date).toLocaleString('es-ES')}</span>
        </div>
        <div style="font-size: 13px; color: #374151; margin-top: 8px;">
          <p><strong>Síntomas (NYHA):</strong> ${s.severity}</p>
          <p><strong>Evolución:</strong> ${s.control_status}</p>
          <p><strong>Mejoría:</strong> ${s.improvement}</p>
        </div>
      </div>
    `).join('');

    document.getElementById('patient-surveys-detail').innerHTML = surveysHtml || '<p style="color: #6b6b6b;">Sin encuestas telefónicas</p>';

    const medicationsHtml = (currentPatient.medications || []).map(m => `
      <div style="padding: 12px; border: 1px solid #e5e5e5; border-radius: 6px; margin-bottom: 8px; background: white;">
        <div style="font-weight: bold; font-size: 14px;">💊 ${m.name}</div>
        <div style="font-size: 13px; color: #374151; margin-top: 4px;">
          Dosis: ${m.dosage} | Frecuencia: ${m.frequency}
        </div>
        <div style="font-size: 12px; color: #6b6b6b; margin-top: 4px;">Inicio: ${new Date(m.start_date || m.created_at).toLocaleDateString('es-ES')}</div>
      </div>
    `).join('');

    document.getElementById('patient-medications-detail').innerHTML = medicationsHtml || '<p style="color: #6b6b6b;">Sin medicamentos recetados</p>';

    document.getElementById('patient-detail-modal').classList.add('active');
  } catch (error) {
    console.error('Error loading patient detail:', error);
  }
}

function closePatientDetail() {
  document.getElementById('patient-detail-modal').classList.remove('active');
}

async function submitPrescription(event) {
  event.preventDefault();
  
  if (!currentPatient) return;

  const payload = {
    name: document.getElementById('prescription-name').value,
    dosage: document.getElementById('prescription-dosage').value,
    frequency: document.getElementById('prescription-frequency').value
  };

  try {
    const response = await fetch(`${API_URL}/patients/${currentPatient.id}/medications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      document.getElementById('prescription-form').reset();
      // Reload patient details to show the new medication
      viewPatientDetail(currentPatient.id);
    } else {
      const data = await response.json();
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Error submitting prescription:', error);
    alert('Ocurrió un error al recetar el tratamiento.');
  }
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

    // Render Prescription (Receta Médica)
    if (patientData.medications && patientData.medications.length > 0) {
      const prescriptionsHtml = `
        <div style="background: #fff; border: 2px solid #e5e5e5; border-radius: 8px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); font-family: 'Times New Roman', serif;">
          <div style="text-align: center; border-bottom: 2px solid #2f6feb; padding-bottom: 16px; margin-bottom: 20px;">
            <img src="https://www.cmdlt.edu.ve/wp-content/uploads/2021/01/logo-centro-medico-docente-la-trinidad.svg" alt="Hospital Logo" style="height: 40px; margin-bottom: 8px;">
            <h3 style="color: #2f6feb; font-family: 'Source Sans Pro', sans-serif;">RECETA MÉDICA</h3>
            <p style="font-size: 14px; color: #6b6b6b; font-family: 'Source Sans Pro', sans-serif;">Unidad de Insuficiencia Cardíaca</p>
          </div>
          <div style="margin-bottom: 24px; font-size: 16px;">
            <p><strong>Paciente:</strong> ${patientData.name}</p>
            <p><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
          </div>
          <div style="margin-bottom: 32px;">
            <h4 style="font-style: italic; font-size: 18px; margin-bottom: 16px; border-bottom: 1px dashed #ccc; padding-bottom: 8px;">Rx</h4>
            <ul style="list-style-type: none; padding: 0;">
              ${patientData.medications.map(m => `
                <li style="margin-bottom: 16px;">
                  <div style="font-weight: bold; font-size: 18px;">${m.name}</div>
                  <div style="margin-top: 4px; font-size: 16px;">Tomar ${m.dosage}, ${m.frequency}</div>
                </li>
              `).join('')}
            </ul>
          </div>
          <div style="text-align: right; border-top: 1px solid #e5e5e5; padding-top: 16px;">
            <p style="font-family: 'Source Sans Pro', sans-serif; font-size: 14px; color: #6b6b6b;">Firma del Médico Tratante</p>
          </div>
        </div>
      `;
      document.getElementById('patient-prescriptions-container').innerHTML = prescriptionsHtml;
    } else {
      document.getElementById('patient-prescriptions-container').innerHTML = '<p style="color: #6b6b6b;">No tienes tratamientos farmacológicos recetados activos.</p>';
    }

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

  if (event && event.target) {
    document.querySelectorAll('#patient-screen .horizontal-menu button').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
  }
}

// ==================== Monitor Dashboard ====================

async function loadMonitorDashboard() {
  try {
    const response = await fetch(`${API_URL}/patients`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    patients = await response.json();

    const html = `
      <table class="data-table" style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 12px; border-bottom: 2px solid #e5e5e5;">Nombre del Paciente</th>
            <th style="text-align: left; padding: 12px; border-bottom: 2px solid #e5e5e5;">Teléfono</th>
            <th style="text-align: left; padding: 12px; border-bottom: 2px solid #e5e5e5;">Edad</th>
            <th style="text-align: right; padding: 12px; border-bottom: 2px solid #e5e5e5;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${patients.map(p => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; font-weight: 500;">${p.name}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; color: #0284c7; font-weight: bold;">${p.phone || 'No registrado'}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${p.age || '-'}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">
                <button onclick="openSurveyModal(${p.id}, '${p.name.replace(/'/g, "\\'")}')" style="background-color: #2563eb; color: white; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer;">📞 Llamar / Encuesta</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

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

// ==================== Nurse Survey ====================

function openSurveyModal(patientId, patientName) {
  document.getElementById('survey-patient-id').value = patientId;
  document.getElementById('survey-patient-name').textContent = patientName;
  document.getElementById('survey-form').reset();
  document.getElementById('survey-modal').classList.add('active');
}

function closeSurveyModal() {
  document.getElementById('survey-modal').classList.remove('active');
}

async function submitSurvey(event) {
  event.preventDefault();
  
  const payload = {
    user_id: document.getElementById('survey-patient-id').value,
    nurse_id: currentUser.id,
    vitals: document.getElementById('survey-vitals').value,
    symptoms: document.getElementById('survey-symptoms').value,
    severity: document.getElementById('survey-severity').value,
    improvement: document.getElementById('survey-improvement').value,
    control_status: document.getElementById('survey-control').value,
    notes: document.getElementById('survey-notes').value
  };

  try {
    const response = await fetch(`${API_URL}/surveys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      alert('Encuesta guardada exitosamente en la historia clínica del paciente.');
      closeSurveyModal();
    } else {
      const data = await response.json();
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Error submitting survey:', error);
    alert('Ocurrió un error al guardar la encuesta.');
  }
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
