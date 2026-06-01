# Historial del Proyecto: Plataforma de Insuficiencia Cardíaca

Este documento resume el progreso, la arquitectura y las funcionalidades desarrolladas en el proyecto, sirviendo como punto de referencia para futuros desarrollos e iteraciones.

## 1. Arquitectura y Stack Tecnológico
- **Backend:** Node.js con Express.
- **Base de Datos:** SQLite (`database.js`).
- **Frontend:** HTML, CSS (Vanilla), y JavaScript puro (`app.js`). Interfaz basada en modales y Single Page Application (SPA).
- **Despliegue:** Railway.app (con base de datos efímera).
- **Repositorio:** GitHub (`sjcava/insuficiencia-cardiaca`).

## 2. Modelos de Base de Datos
- **Users:** Almacena Pacientes, Médicos (Doctors) y Enfermeras (Monitors).
- **Vital_Records:** Almacena registros diarios (Presión, Frecuencia Cardíaca, Peso, Disnea, Edema).
- **Alerts:** Almacena notificaciones automáticas de riesgo según umbrales clínicos.
- **Medications:** Control de medicamentos prescritos al paciente.
- **Nurse_Surveys:** Almacena el resultado de las encuestas de telemonitoreo telefónico realizadas por enfermería.
- **BNP_Records / Lab_Results:** Preparados para guardar marcadores bioquímicos (NT-proBNP) y laboratorios.

## 3. Funcionalidades por Perfil (Roles)

### 🧑‍⚕️ Rol: Médico (Cardiólogo)
- **Dashboard Principal:** Visualiza la lista de pacientes registrados.
- **Alertas Críticas:** Visualiza en tiempo real las alertas rojas generadas por descompensación (ej: aumento brusco de peso >2kg en 72h, crisis hipertensiva >160, taquicardia severa).
- **Historial Clínico del Paciente:** Al hacer clic en un paciente, se abre un modal con:
  - Últimos signos vitales históricos.
  - Alertas activas específicas del paciente.
  - **Historial de Telemonitoreo:** Visualización de las encuestas telefónicas realizadas por el equipo de enfermería (gravedad NYHA, evolución, mejoría).
- **Acciones:** Marcar alertas como leídas/atendidas.

### 🩺 Rol: Enfermera (Monitor)
- **Dashboard de Telemonitoreo:** Muestra una lista de todos los pacientes junto con su **número de teléfono**.
- **Llamadas y Encuestas:** Botón de "Llamar / Encuesta" que despliega un formulario clínico basado en las guías recientes de Insuficiencia Cardíaca.
  - Registra: Signos vitales actuales, nivel de disnea/edema, gravedad según clasificación NYHA, control evolutivo y mejoría bajo el tratamiento.
  - Una vez enviada, esta encuesta se guarda en la base de datos y se hace visible para el médico.

### 🫀 Rol: Paciente
- **Registrar Síntomas:** Formulario amigable para registrar signos vitales diarios (PA, FC, Peso) y nivel de síntomas.
- **Histórico:** Gráficas visuales (usando Chart.js) para ver la tendencia de su presión arterial, frecuencia cardíaca y peso.
- **Tratamiento Farmacológico:** Guía de medicamentos (los 4 pilares: Diuréticos, Betabloqueantes, SGLT2, ARNI/IECAS) con indicaciones de qué síntomas alivian y precauciones (NO automedicarse).
- **Recomendaciones de Estilo de Vida:** Guías clínicas de prevención, dieta (restricción de sal y líquidos), ejercicio, y prevención (tabaco, alcohol).
- **Signos de Alarma (Red Flags):** Cuadro de alerta crítica indicándole cuándo debe acudir inmediatamente a urgencias (ortopnea severa, síncope, dolor de pecho, etc.).

## 4. Lógica Clínica Integrada (Backend)
- **Motor de Alertas (`alerts.js`):** Intercepta cada nuevo registro del paciente y calcula alertas.
  - *Algoritmo de Aumento de Peso:* Compara el peso actual con el peso de hace 72h para disparar una alerta de retención de líquidos.
  - *Umbrales de Presión Arterial y FC:* Alertas de diferentes severidades (amarillo, naranja, rojo).
- **Internacionalización (i18n):** Todo el sistema clínico, traducciones médicas, diagnósticos simulados e interfaz gráfica están traducidos al Español.

## 5. Script de Inicialización y Prueba
- **Seed Data (`seed-data.js`):** Debido al almacenamiento efímero de Railway, se diseñó un script que se ejecuta automáticamente (`npm start`) para inyectar perfiles de prueba (Dr. Pérez, Monitora Ana, y Paciente Juan García López) con historiales médicos realistas en español.
- **Testing:** Se desarrollaron comandos asíncronos vía `curl` para inyectar estados críticos (ej: paciente con presión de 175/100, edema severo y asfixia) para comprobar el motor de alertas y la reacción de la UI de médicos.

## 6. Siguientes Pasos (Futuro)
- Autenticación real (JWT y login con contraseñas encriptadas).
- Integración real con Google Sheets o exportación de reportes a PDF/CSV.
- Almacenamiento persistente en Railway (volumen persistente) o migración a base de datos PostgreSQL en la nube.
- Recordatorios push/email para que los pacientes registren sus signos.
