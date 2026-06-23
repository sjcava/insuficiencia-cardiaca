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
    loadPatientControl('');
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
          <p><strong>Clínica:</strong> ${s.vitals || '-'}</p>
          <p><strong>Signos:</strong> ${s.symptoms || '-'}</p>
          <p><strong>Gravedad (NYHA):</strong> ${s.severity}</p>
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

    // Removed history load since patient-history view was deleted
  } catch (error) {
    console.error('Error loading patient dashboard:', error);
  }
}

function toggleKilosInput(value) {
  document.getElementById('kilos-container').style.display = (value === 'Sí') ? 'block' : 'none';
  if (value !== 'Sí') {
    document.getElementById('survey-kilos').value = '';
  }
}

async function submitPatientSurvey(event) {
  event.preventDefault();

  const survey = {
    user_id: currentUser.id,
    shortness_of_breath: document.getElementById('survey-shortness').value,
    swelling: document.getElementById('survey-swelling').value,
    weight_gain: document.getElementById('survey-weight-gain').value,
    kilos_gained: parseFloat(document.getElementById('survey-kilos').value) || null,
    fatigue: document.getElementById('survey-fatigue').value,
    blood_pressure: document.getElementById('survey-bp').value,
    normal_urination: document.getElementById('survey-urination').value,
    loss_of_consciousness: document.getElementById('survey-consciousness').value
  };

  try {
    const response = await fetch(`${API_URL}/surveys/patient-survey`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(survey)
    });

    if (response.ok) {
      document.getElementById('survey-message').textContent = '✅ Encuesta guardada correctamente';
      document.getElementById('survey-message').style.color = '#17A34A';
      document.getElementById('record-form').reset();
      toggleKilosInput('No');
    } else {
      throw new Error('Error del servidor');
    }
  } catch (error) {
    document.getElementById('survey-message').textContent = '❌ Error al guardar la encuesta';
    document.getElementById('survey-message').style.color = '#dc2626';
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
  } else if (viewName === 'monitor-patients-control') {
    loadPatientControl('');
  } else if (viewName === 'monitor-patient-surveys') {
    loadMonitorPatientSurveys();
  }

  document.querySelectorAll('#monitor-screen .sidebar-menu button').forEach(b => b.classList.remove('active'));
  if (event && event.target && event.target.tagName === 'BUTTON') {
    event.target.classList.add('active');
  }
}

async function loadMonitorPatientSurveys() {
  try {
    const response = await fetch(`${API_URL}/surveys/patient-survey/all`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const surveys = await response.json();

    const tbody = document.getElementById('monitor-surveys-list');
    tbody.innerHTML = surveys.map(s => `
      <tr>
        <td>${new Date(s.recorded_date).toLocaleString('es-ES')}</td>
        <td style="font-weight: 500;">${s.patient_name}</td>
        <td>${s.shortness_of_breath === 'Sí' ? '<span style="color:red; font-weight:bold;">Sí</span>' : 'No'}</td>
        <td>${s.swelling === 'Sí' ? '<span style="color:#d97706; font-weight:bold;">Sí</span>' : 'No'}</td>
        <td>${s.weight_gain === 'Sí' ? '<span style="color:#d97706; font-weight:bold;">Sí (' + s.kilos_gained + ' kg)</span>' : 'No'}</td>
        <td>${s.fatigue === 'Sí' ? '<span style="color:#d97706; font-weight:bold;">Sí</span>' : 'No'}</td>
        <td>${s.blood_pressure || '-'}</td>
        <td>${s.normal_urination === 'No' ? '<span style="color:#d97706; font-weight:bold;">No</span>' : 'Sí'}</td>
        <td>${s.loss_of_consciousness === 'Sí' ? '<span style="color:red; font-weight:bold;">Sí</span>' : 'No'}</td>
      </tr>
    `).join('');

    if (surveys.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #666;">No hay encuestas llenadas por los pacientes</td></tr>';
    }
  } catch (error) {
    console.error('Error fetching patient surveys:', error);
  }
}

async function updateContactDate(patientId, newDate) {
  try {
    const response = await fetch(`${API_URL}/patients/${patientId}/contact-date`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ next_contact_date: newDate })
    });
    
    if (!response.ok) {
      const data = await response.json();
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Error updating contact date:', error);
    alert('Error de conexión al actualizar la fecha.');
  }
}

// ==================== Patient Control & History ====================

async function loadPatientControl(query = '') {
  try {
    const url = query.trim() ? `${API_URL}/patients/search/${encodeURIComponent(query)}` : `${API_URL}/patients`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const patients = await response.json();
    
    const html = patients.map(p => `
      <tr>
        <td style="font-weight: 600;">${p.name} <span style="font-weight: normal; color: #666; font-size: 0.9em;">(${p.age || 'N/A'} años)</span></td>
        <td>${p.phone || 'N/A'}</td>
        <td>
          <input type="date" value="${p.next_contact_date ? p.next_contact_date.substring(0,10) : ''}" 
                 onchange="updateContactDate(${p.id}, this.value)" style="padding: 4px; border-radius: 4px; border: 1px solid #ccc;">
        </td>
        <td>
          <button onclick="viewPatientHistory(${p.id})" class="btn-secondary" style="margin-right: 8px;">Ver Historia</button>
          <button onclick="openSurveyModal(${p.id}, '${p.name.replace(/'/g, "\\'")}')" class="btn-secondary">Llamar</button>
        </td>
      </tr>
    `).join('');
    
    document.getElementById('patient-control-list').innerHTML = html || '<tr><td colspan="4" style="text-align: center; color: #666;">No se encontraron pacientes</td></tr>';
  } catch (error) {
    console.error('Error loading patients:', error);
  }
}

function handlePatientControlSearch(event) {
  if (event.key === 'Enter') {
    loadPatientControl(event.target.value);
  }
}

async function viewPatientHistory(patientId) {
  try {
    const response = await fetch(`${API_URL}/patients/${patientId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    // Populate Info
    document.getElementById('history-patient-name').textContent = data.name;
    document.getElementById('history-patient-age').textContent = data.age || 'N/A';
    document.getElementById('history-patient-phone').textContent = data.phone || 'N/A';
    document.getElementById('history-patient-email').textContent = data.email || 'N/A';
    document.getElementById('history-patient-condition').textContent = data.condition_details || 'Sin detalles registrados';

    // Populate Medications
    const medsHtml = (data.medications && data.medications.length > 0) 
      ? data.medications.map(m => `<li><strong>${m.name}</strong> - ${m.dosage} (${m.frequency})</li>`).join('')
      : '<li>Sin medicación registrada</li>';
    document.getElementById('history-medications-list').innerHTML = medsHtml;

    // Populate Vitals
    const vitalsHtml = data.latestVital 
      ? `<p><strong>Fecha:</strong> ${new Date(data.latestVital.recorded_date).toLocaleString('es-ES')}</p>
         <p><strong>FC:</strong> ${data.latestVital.heart_rate} bpm</p>
         <p><strong>PA:</strong> ${data.latestVital.blood_pressure} mmHg</p>
         <p><strong>Peso:</strong> ${data.latestVital.weight} kg</p>
         <p><strong>Saturación:</strong> ${data.latestVital.oxygen_saturation}%</p>`
      : '<p>Sin signos vitales registrados</p>';
    document.getElementById('history-vitals-container').innerHTML = vitalsHtml;

    // Populate Surveys
    const surveysHtml = (data.surveys && data.surveys.length > 0)
      ? data.surveys.map(s => `
          <div style="border: 1px solid #e5e5e5; border-radius: 6px; padding: 12px; margin-bottom: 12px; background: #fff;">
            <div style="font-size: 12px; color: #666; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
              <strong>Fecha:</strong> ${new Date(s.recorded_date).toLocaleString('es-ES')} | <strong>Enfermera:</strong> ${s.nurse_name}
            </div>
            <p style="margin-bottom: 4px;"><strong>Signos:</strong> ${s.vitals}</p>
            <p style="margin-bottom: 4px;"><strong>Síntomas:</strong> ${s.symptoms}</p>
            <p style="margin-bottom: 4px;"><strong>Severidad:</strong> ${s.severity} | <strong>Evolución:</strong> ${s.improvement}</p>
            <p style="margin-bottom: 4px;"><strong>Status:</strong> ${s.control_status}</p>
            ${s.notes ? `<p style="margin-top: 6px; font-style: italic; color: #444;">" ${s.notes} "</p>` : ''}
          </div>
        `).join('')
      : '<p style="color: #666;">No hay encuestas registradas para este paciente.</p>';
    document.getElementById('history-surveys-list').innerHTML = surveysHtml;

    // Show modal
    document.getElementById('history-modal').classList.add('active');
  } catch (error) {
    console.error('Error fetching patient history:', error);
    alert('Error de conexión.');
  }
}

function closeHistoryModal() {
  document.getElementById('history-modal').classList.remove('active');
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
  
  const bp = document.getElementById('survey-bp').value;
  const urine = document.getElementById('survey-urine').value;
  const weightGain = document.getElementById('survey-weight-gain').value;
  
  const edema = document.getElementById('survey-edema').value;
  const swelling = document.getElementById('survey-swelling').value;
  const fatigue = document.getElementById('survey-fatigue').value;
  const dyspnea = document.getElementById('survey-dyspnea').value;

  const vitalsText = `PA: ${bp} | Orina: ${urine} | Aumento Peso: ${weightGain}`;
  const symptomsText = `Edema: ${edema} | Hinchazón: ${swelling} | Cansancio: ${fatigue} | Disnea: ${dyspnea}`;

  const isDecompensated = (weightGain === 'Sí' || edema === 'Sí' || swelling === 'Sí' || dyspnea === 'Sí');

  const payload = {
    user_id: document.getElementById('survey-patient-id').value,
    nurse_id: currentUser.id,
    vitals: vitalsText,
    symptoms: symptomsText,
    severity: document.getElementById('survey-severity').value,
    improvement: document.getElementById('survey-improvement').value,
    control_status: document.getElementById('survey-control').value,
    notes: document.getElementById('survey-notes').value,
    is_decompensated: isDecompensated
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
