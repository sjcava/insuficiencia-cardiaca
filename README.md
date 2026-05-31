# HealthTech - Unidad de Insuficiencia Cardíaca (UCI)

Aplicación integral de gestión para pacientes con insuficiencia cardíaca, con dashboards especializados para pacientes, médicos y personal de enfermería.

## 🏥 Características Principales

- **Dashboard Médico**: Búsqueda de pacientes, visualización de datos, triage automático, alertas críticas
- **Dashboard Paciente**: Registro diario de síntomas y signos vitales, alertas en tiempo real, histórico
- **Sistema de Alertas**: Generación automática basada en umbrales clínicos (presión, BNP, disnea, edema, peso)
- **Integración Google Sheets**: Sincronización bidireccional de datos clínicos
- **Gestión Usuarios**: Autenticación JWT, roles diferenciados (paciente, doctor, monitor)
- **Base de Datos SQLite**: Almacenamiento local con sincronización a Google Sheets

## 📋 Requisitos Previos

- Node.js 16+ y npm
- Google Sheets API credentials (para integración)
- Git (opcional)

## 🚀 Instalación y Setup

### 1. Clonar/Descargar el Proyecto

```bash
# Si tienes git
git clone <repo-url>
cd healthtech-app

# O simplemente descarga los archivos
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Copia `.env.example` a `.env` y rellena los valores:

```bash
cp .env.example .env
```

**Archivo `.env`:**

```
PORT=3001
NODE_ENV=development
JWT_SECRET=tu_clave_secreta_muy_segura_aqui

# Google Sheets (opcional para fase 1)
GOOGLE_SHEETS_ID=tu_id_de_hoja
GOOGLE_SERVICE_ACCOUNT_TYPE=service_account
GOOGLE_SERVICE_ACCOUNT_PROJECT_ID=tu_project_id
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL=tu-email@tu-project.iam.gserviceaccount.com

# Email (Fase 2)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password

DB_PATH=./data/healthtech.db
```

### 4. Generar Base de Datos con Datos de Demostración

```bash
npm run seed
```

Esto crea la base de datos SQLite y carga:
- 5 pacientes ficticios con historiales
- 2 médicos cardiólogos
- 2 enfermeras/monitoras
- 30 días de registros vitales por paciente
- Registros de BNP

## ▶️ Ejecutar la Aplicación

### Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3001`

### Producción

```bash
npm start
```

## 👤 Credenciales de Demo

Después de `npm run seed`, puedes iniciar sesión con:

| Rol | Email | Contraseña |
|-----|-------|-----------|
| **Paciente** | juan.garcia@example.com | password123 |
| **Doctor** | dr.sanchez@hospital.com | password123 |
| **Enfermera** | nurse.elena@hospital.com | password123 |

## 📊 Estructura de Carpetas

```
healthtech-app/
├── backend/
│   ├── database.js              # Inicialización SQLite
│   ├── routes/
│   │   ├── auth.js             # Login, registro, verificación
│   │   ├── patients.js         # Gestión de pacientes
│   │   ├── records.js          # Registros vitales
│   │   └── alerts.js           # Alertas clínicas
│   └── services/
│       ├── alerts.js           # Lógica de generación de alertas
│       └── google-sheets.js    # Integración Google Sheets
├── public/
│   ├── index.html              # SPA responsivo
│   └── app.js                  # Lógica frontend
├── scripts/
│   └── seed-data.js           # Generador de datos demo
├── data/
│   └── healthtech.db          # Base de datos SQLite (generada)
├── server.js                   # Servidor Express
├── package.json
├── .env.example
└── README.md
```

## 🔌 API REST

### Autenticación

```
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/verify
```

### Pacientes

```
GET    /api/patients                    # Listar todos
GET    /api/patients/:id                # Detalles de uno
GET    /api/patients/search/:query      # Búsqueda
PUT    /api/patients/:id                # Actualizar
```

### Registros Vitales

```
GET    /api/records/patient/:userId     # Registros de un paciente
POST   /api/records                     # Crear nuevo registro
GET    /api/records/patient/:userId/range?startDate=...&endDate=...
```

### Alertas

```
GET    /api/alerts/user/:userId         # Alertas de un usuario
GET    /api/alerts/user/:userId/unread  # Solo sin leer
GET    /api/alerts/critical             # Alertas críticas del sistema
PUT    /api/alerts/:alertId/read        # Marcar como leída
```

## 🚨 Umbrales de Alertas Clínicas

| Tipo | Umbral | Severidad |
|------|--------|-----------|
| **Presión Alta** | SYS > 160 o DIA > 100 | CRÍTICA |
| **Presión Elevada** | SYS > 140 o DIA > 90 | ALTA |
| **Disnea** | Nivel 3-4 | ALTA/CRÍTICA |
| **Edema** | Nivel 2-3 | ALTA |
| **Ganancia Peso** | > 3 kg en 7 días | ALTA |
| **BNP Elevado** | > 400 pg/mL | ALTA |
| **Frecuencia Cardíaca** | > 120 lpm | ALTA |

## 🔄 Google Sheets Integration (Fase 2)

Cuando estés listo para integrar Google Sheets:

1. **Crear Service Account en Google Cloud Console**
   - Project > Service Accounts
   - Create Service Account
   - Create Key (JSON)
   - Enable Google Sheets API

2. **Configurar en `.env`**
   ```
   GOOGLE_SERVICE_ACCOUNT_TYPE=service_account
   GOOGLE_SERVICE_ACCOUNT_PROJECT_ID=tu-project-id
   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="tu-private-key"
   GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL=tu-email@...
   GOOGLE_SHEETS_ID=id-de-tu-hoja
   ```

3. **Crear estructura en Google Sheets**
   ```
   Nombre | Email | Fecha | Sistólica | Diastólica | FC | Peso | Disnea | Edema | Notas
   ```

4. **Sincronización Automática**
   ```bash
   # Sincronizar manualmente
   curl -X POST http://localhost:3001/api/sync-sheets

   # O automático cada 30 minutos (código interno)
   ```

## 📧 Email Notifications (Fase 2)

La estructura para emails está lista pero desactivada. Para activar:

1. Configurar SMTP en `.env`
2. Usar las clases en `backend/services/email.js`
3. Llamar desde `checkAndCreateAlerts` cuando se genere una alerta crítica

## 🗄️ Estructura Base de Datos

### users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,  -- bcrypt hash
  name TEXT NOT NULL,
  role TEXT ('patient', 'doctor', 'monitor'),
  age INTEGER,
  phone TEXT,
  condition_details TEXT,
  created_at DATETIME,
  updated_at DATETIME
);
```

### vital_records
```sql
CREATE TABLE vital_records (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  systolic INTEGER,
  diastolic INTEGER,
  heart_rate INTEGER,
  weight REAL,
  dyspnea_level INTEGER (0-4),
  edema_level INTEGER (0-3),
  notes TEXT,
  recorded_date DATETIME,
  synced_to_sheets INTEGER (0/1)
);
```

### alerts
```sql
CREATE TABLE alerts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  type TEXT ('high_pressure', 'high_bnp', 'weight_gain', 'dyspnea', 'edema', 'irregular_hr'),
  severity TEXT ('low', 'medium', 'high', 'critical'),
  message TEXT,
  read INTEGER (0/1),
  created_at DATETIME
);
```

## 🔐 Seguridad

- ✅ Contraseñas hasheadas con bcryptjs
- ✅ Autenticación JWT con expiración 7 días
- ✅ CORS configurado
- ✅ Variables sensibles en `.env` (no en código)
- ⚠️ En producción: usar HTTPS, cambiar JWT_SECRET, configurar CORS domains

## 📱 Responsive Design

- ✅ Móvil (320px+)
- ✅ Tablet (768px+)
- ✅ Desktop (1024px+)
- ✅ Layouts adaptables por rol

## 🧪 Testing

Credenciales de test ya incluidas en seed. Prueba:

1. **Flujo Paciente**: Registrar síntomas → Ver alertas
2. **Flujo Doctor**: Buscar paciente → Ver detalles → Ver alertas críticas
3. **Flujo Enfermera**: Ver estado de pacientes → Monitorear alertas

## 🚢 Deployment

### Heroku

```bash
heroku create mi-healthtech-app
heroku config:set JWT_SECRET=...
git push heroku main
```

### Railway / Render / Vercel

Compatible con Node.js. Solo necesita:
- `npm install` + `npm start`
- Variables de entorno en plataforma
- SQLite persiste en `/data/`

## 📞 Soporte

Para integración Google Sheets, emails o features adicionales, contacta al equipo técnico.

---

**Versión:** 1.0.0
**Última actualización:** 2024
**Estado:** Producción
