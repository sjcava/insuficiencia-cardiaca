# 📚 API Documentation - HealthTech UCI

Base URL: `http://localhost:3001/api`

Todas las solicitudes deben incluir el header:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 🔐 Authentication

### POST /auth/login
Inicia sesión de usuario

**Request:**
```json
{
  "email": "usuario@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "name": "Juan García",
    "role": "patient"
  }
}
```

**Errors:**
- `400` - Email o contraseña faltantes
- `401` - Email o contraseña inválidos

---

### POST /auth/register
Registra un nuevo usuario

**Request:**
```json
{
  "email": "nuevo@example.com",
  "password": "password123",
  "name": "Nuevo Usuario",
  "role": "patient"
}
```

**Roles válidos:** `patient`, `doctor`, `monitor`

**Response (201 Created):**
```json
{
  "message": "User created successfully"
}
```

**Errors:**
- `400` - Campos faltantes
- `409` - Email ya existe

---

### GET /auth/verify
Verifica que el token JWT sea válido

**Response (200 OK):**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "role": "patient",
    "name": "Juan García"
  }
}
```

**Errors:**
- `401` - Token inválido o no proporcionado

---

## 👥 Pacientes

### GET /patients
Lista todos los pacientes

**Query Params:**
- ninguno

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "email": "juan.garcia@example.com",
    "name": "Juan García López",
    "age": 68,
    "phone": "+34 612 345 678",
    "condition_details": "Heart failure, NYHA Class II"
  }
]
```

---

### GET /patients/:id
Obtiene detalles de un paciente incluyendo histórico de vitales

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "juan.garcia@example.com",
  "name": "Juan García López",
  "age": 68,
  "phone": "+34 612 345 678",
  "condition_details": "Heart failure, NYHA Class II",
  "vitals": [
    {
      "id": 100,
      "systolic": 145,
      "diastolic": 88,
      "heart_rate": 78,
      "weight": 82.5,
      "dyspnea_level": 1,
      "edema_level": 0,
      "notes": "Routine measurement",
      "recorded_date": "2024-05-31T14:30:00Z"
    }
  ],
  "alerts": [
    {
      "id": 50,
      "type": "high_pressure",
      "severity": "high",
      "message": "High systolic pressure: 145 mmHg",
      "read": 0,
      "created_at": "2024-05-31T14:30:00Z"
    }
  ],
  "medications": [
    {
      "id": 1,
      "name": "Lisinopril",
      "dosage": "10mg",
      "frequency": "Once daily"
    }
  ],
  "latestVital": { /* último registro */ }
}
```

**Errors:**
- `404` - Paciente no encontrado

---

### GET /patients/search/:query
Busca pacientes por nombre o email

**Ejemplo:** `GET /patients/search/juan`

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Juan García López",
    "email": "juan.garcia@example.com",
    "age": 68,
    "phone": "+34 612 345 678"
  }
]
```

---

### PUT /patients/:id
Actualiza información del paciente

**Request:**
```json
{
  "name": "Juan García López",
  "age": 68,
  "phone": "+34 612 345 678",
  "condition_details": "Heart failure, NYHA Class II, new condition"
}
```

**Response (200 OK):**
```json
{
  "message": "Patient updated"
}
```

---

## 📊 Registros de Vitales

### GET /records/patient/:userId
Obtiene todos los registros vitales de un paciente

**Response (200 OK):**
```json
[
  {
    "id": 100,
    "user_id": 1,
    "systolic": 145,
    "diastolic": 88,
    "heart_rate": 78,
    "weight": 82.5,
    "dyspnea_level": 1,
    "edema_level": 0,
    "notes": "Routine measurement",
    "recorded_date": "2024-05-31T14:30:00Z",
    "synced_to_sheets": 0
  }
]
```

---

### GET /records/patient/:userId/range
Obtiene registros vitales en un rango de fechas

**Query Params:**
- `startDate` (ISO 8601): `2024-05-01T00:00:00Z`
- `endDate` (ISO 8601): `2024-05-31T23:59:59Z`

**Example:** `GET /records/patient/1/range?startDate=2024-05-01T00:00:00Z&endDate=2024-05-31T23:59:59Z`

---

### POST /records
Crea un nuevo registro de vitales

**Request:**
```json
{
  "user_id": 1,
  "systolic": 145,
  "diastolic": 88,
  "heart_rate": 78,
  "weight": 82.5,
  "dyspnea_level": 1,
  "edema_level": 0,
  "notes": "Patient felt slightly dizzy"
}
```

**Response (201 Created):**
```json
{
  "id": 101,
  "message": "Record created"
}
```

⚠️ **Nota:** Al crear un registro, el sistema automáticamente:
1. Evalúa los signos vitales
2. Genera alertas si hay umbrales excedidos
3. Actualiza el estado del paciente

**Errors:**
- `400` - Falta `user_id` o está vacío

---

### POST /records/bnp
Crea un registro de BNP (péptido natriurético B)

**Request:**
```json
{
  "user_id": 1,
  "value": 350
}
```

**Response (201 Created):**
```json
{
  "id": 50
}
```

⚠️ Si BNP > 400 pg/mL, genera automáticamente una alerta `high_bnp`

---

### GET /records/bnp/:userId
Obtiene últimos registros de BNP de un paciente

**Response (200 OK):**
```json
[
  {
    "id": 50,
    "user_id": 1,
    "value": 350,
    "recorded_date": "2024-05-31T10:00:00Z"
  }
]
```

---

## 🚨 Alertas

### GET /alerts/user/:userId
Obtiene alertas de un usuario específico

**Query Params (opcional):**
- `read` (0 o 1): Filtrar por estado leído

**Example:** `GET /alerts/user/1?read=0` (solo no leídas)

**Response (200 OK):**
```json
[
  {
    "id": 50,
    "user_id": 1,
    "type": "high_pressure",
    "severity": "high",
    "message": "High systolic pressure: 145 mmHg",
    "read": 0,
    "created_at": "2024-05-31T14:30:00Z"
  }
]
```

---

### GET /alerts/user/:userId/unread
Obtiene **solo** alertas no leídas (conveniente para UI)

**Response (200 OK):**
```json
[
  {
    "id": 50,
    "user_id": 1,
    "type": "high_pressure",
    "severity": "critical",
    "message": "High systolic pressure: 165 mmHg",
    "read": 0,
    "created_at": "2024-05-31T14:30:00Z"
  }
]
```

---

### GET /alerts/critical
Obtiene **alertas críticas de TODO el sistema** (para doctor/monitor)

**Response (200 OK):**
```json
[
  {
    "id": 50,
    "user_id": 1,
    "type": "high_pressure",
    "severity": "critical",
    "message": "High systolic pressure: 165 mmHg",
    "read": 0,
    "created_at": "2024-05-31T14:30:00Z",
    "name": "Juan García López"
  }
]
```

---

### PUT /alerts/:alertId/read
Marca una alerta como leída

**Request:** (body vacío)

**Response (200 OK):**
```json
{
  "message": "Alert marked as read"
}
```

---

### PUT /alerts/user/:userId/read-all
Marca **todas** las alertas de un usuario como leídas

**Response (200 OK):**
```json
{
  "message": "All alerts marked as read"
}
```

---

## 📈 Google Sheets Integration

### POST /sync-sheets
Sincroniza los registros vitales sin sincronizar a Google Sheets

**Requiere:** 
- Variables de entorno Google configuradas en `.env`
- Google Sheets ID y credenciales válidas

**Response (200 OK):**
```json
{
  "message": "Sync successful"
}
```

**Errors:**
- `500` - Error en sincronización (revisar credenciales)

---

## ✅ Health Check

### GET /api/health
Verifica que la API esté disponible

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2024-05-31T15:30:45.123Z"
}
```

---

## 📋 Tipos de Alertas

| Type | Descripción | Trigger |
|------|-------------|---------|
| `high_pressure` | Presión arterial elevada | SYS > 140 o DIA > 90 |
| `high_bnp` | BNP elevado | BNP > 400 pg/mL |
| `weight_gain` | Ganancia de peso rápida | > 3 kg en 7 días |
| `dyspnea` | Disnea moderada-severa | Nivel 3-4 |
| `edema` | Edema moderado-severo | Nivel 2-3 |
| `irregular_hr` | Frecuencia cardíaca anómala | HR > 120 lpm |

---

## 📊 Severidades de Alertas

| Severidad | Color | Riesgo |
|-----------|-------|--------|
| `critical` | Rojo | ⚠️ Requiere intervención inmediata |
| `high` | Amarillo | ⚠️ Requiere seguimiento cercano |
| `medium` | Azul | ℹ️ Monitorear |
| `low` | Verde | ✓ Informativo |

---

## 🔒 Headers y Autenticación

Todas las rutas excepto `/auth/login` y `/auth/register` requieren:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

El token expira en **7 días**. Después debe hacer login nuevamente.

---

## ⚠️ Error Responses

### 401 Unauthorized
```json
{
  "error": "No token provided" 
  // o 
  "error": "Invalid token"
}
```

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 404 Not Found
```json
{
  "error": "Patient not found"
}
```

### 409 Conflict
```json
{
  "error": "Email already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## 📝 Ejemplos cURL

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan.garcia@example.com","password":"password123"}'
```

### Get Patient Detail
```bash
curl -X GET http://localhost:3001/api/patients/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Vital Record
```bash
curl -X POST http://localhost:3001/api/records \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "systolic": 145,
    "diastolic": 88,
    "heart_rate": 78,
    "weight": 82.5,
    "dyspnea_level": 1,
    "edema_level": 0,
    "notes": "Routine measurement"
  }'
```

### Get Critical Alerts
```bash
curl -X GET http://localhost:3001/api/alerts/critical \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Versión API:** 1.0.0
**Última actualización:** 2024-05-31
