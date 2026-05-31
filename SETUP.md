# ⚡ Setup Rápido - HealthTech UCI

## 1️⃣ Instalación Rápida (5 minutos)

```bash
# 1. Instalar dependencias
npm install

# 2. Generar base de datos con datos de demo
npm run seed

# 3. Iniciar servidor
npm start
# o para desarrollo (auto-reload):
npm run dev
```

✅ **Listo!** Accede a `http://localhost:3001`

## 2️⃣ Credenciales de Demo (Prueba Rápida)

Elige una y inicia sesión:

**👤 Paciente**
- Email: `juan.garcia@example.com`
- Contraseña: `password123`
- Acción: Registra síntomas → Observa alertas automáticas

**👨‍⚕️ Doctor**
- Email: `dr.sanchez@hospital.com`
- Contraseña: `password123`
- Acción: Busca pacientes → Ve gráficos → Analiza alertas críticas

**👩‍⚕️ Enfermera**
- Email: `nurse.elena@hospital.com`
- Contraseña: `password123`
- Acción: Monitorea estado de todos los pacientes

## 3️⃣ Estructura de Archivos Clave

```
├── server.js              ← Entrada principal (Express)
├── backend/
│   ├── database.js        ← SQLite + Schema
│   ├── routes/*.js        ← APIs REST
│   └── services/*.js      ← Lógica (alertas, Google Sheets, etc)
├── public/
│   ├── index.html         ← Frontend SPA (HTML+CSS)
│   └── app.js            ← Lógica Frontend (JavaScript vanilla)
├── scripts/
│   └── seed-data.js      ← Carga datos de demo
├── data/
│   └── healthtech.db     ← SQLite (generada con seed)
└── .env                  ← Variables de entorno
```

## 4️⃣ Configuración Google Sheets (Fase 2)

Cuando estés listo para integración en vivo:

1. **Obtener credenciales**: [Google Cloud Console](https://console.cloud.google.com)
   - Crear service account
   - Descargar JSON
   
2. **Rellenar `.env`**:
   ```
   GOOGLE_SHEETS_ID=1a2b3c...xyz
   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL=sa@project.iam.gserviceaccount.com
   ```

3. **Sync manual**:
   ```bash
   curl -X POST http://localhost:3001/api/sync-sheets
   ```

## 5️⃣ Endpoints API (Referencia Rápida)

### Auth
```
POST /api/auth/login              { email, password }
POST /api/auth/register           { email, password, name, role }
GET  /api/auth/verify             (requiere token JWT)
```

### Pacientes (Doctor/Enfermera)
```
GET  /api/patients                Listar todos
GET  /api/patients/:id            Detalles + últimos vitales
GET  /api/patients/search/:query  Búsqueda
```

### Registros Vitales (Paciente)
```
GET  /api/records/patient/:id
POST /api/records                 { user_id, systolic, diastolic, heart_rate, weight, dyspnea_level, edema_level, notes }
```

### Alertas (Doctor/Paciente)
```
GET  /api/alerts/user/:id
GET  /api/alerts/critical
PUT  /api/alerts/:id/read
```

## 6️⃣ Umbrales de Alerta (Valores Clínicos)

| Condición | Umbral | Severidad |
|-----------|--------|-----------|
| Presión sistólica | > 160 mmHg | **CRÍTICA** |
| Presión sistólica | > 140 mmHg | **ALTA** |
| Disnea | Nivel 3-4 | **ALTA/CRÍTICA** |
| Edema | Nivel 2-3 | **ALTA** |
| Ganancia peso | > 3 kg en 7 días | **ALTA** |
| BNP | > 400 pg/mL | **ALTA** |
| Frecuencia cardíaca | > 120 lpm | **ALTA** |

Las alertas se generan **automáticamente** cuando un paciente registra síntomas.

## 7️⃣ Flujos de Usuario

### 📝 Flujo Paciente
1. Login con credenciales
2. Ve su estado actual (últimos vitales)
3. Click en "Registrar Síntomas"
4. Completa formulario
5. Sistema genera alertas automáticamente
6. Dashboard muestra alertas en rojo/amarillo

### 👨‍⚕️ Flujo Doctor
1. Login con credenciales
2. Ve dashboard con alertas críticas
3. Busca paciente específico
4. Ve histórico de 30 días + gráficos
5. Revisa alertas activas
6. Puede marcar alertas como leídas

### 👩‍⚕️ Flujo Enfermera
1. Login con credenciales
2. Ve lista de todos los pacientes
3. Monitorea alertas críticas
4. Puede ver estado general

## 8️⃣ Troubleshooting

**Puerto 3001 ocupado:**
```bash
# Cambiar puerto en .env
PORT=3002
```

**Error SQLite:**
```bash
# Limpiar y regenerar DB
rm -rf data/
npm run seed
```

**Token expirado:**
```bash
# Logout y login nuevamente (token JWT expira en 7 días)
# O cambiar en server.js: { expiresIn: '30d' }
```

**Google Sheets no sincroniza:**
```bash
# Verificar credenciales en .env
# Crear hoja con estas columnas:
# Nombre | Email | Fecha | Sistólica | Diastólica | FC | Peso | Disnea | Edema | Notas
```

## 9️⃣ Datos de Demo Generados

Con `npm run seed`:
- **5 pacientes** ficticios con historiales
- **30 días** de registros vitales por paciente
- **Alertas mixtas** generadas automáticamente
- **2 doctores**, **2 enfermeras**
- **Medicamentos** asignados a cada paciente

Todos los datos son ficticios y realistas para testing.

## 🔟 Próximos Pasos

- [ ] Integrar Google Sheets (fase 2)
- [ ] Configurar emails automáticos (SendGrid/SMTP)
- [ ] Añadir gráficos (Chart.js)
- [ ] Tests automatizados
- [ ] Mejorar autenticación (2FA)
- [ ] Dashboard de reportes por médico
- [ ] Exportar PDFs

---

**¿Preguntas?** Revisa `README.md` para detalles completos o contacta al equipo.
