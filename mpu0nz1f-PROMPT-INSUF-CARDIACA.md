"Actúa como un desarrollador Full-Stack Senior experto en aplicaciones de salud
(HealthTech). Tu tarea es diseñar la arquitectura y escribir el código base para una
aplicación web moderna orientada al manejo y seguimiento de pacientes de una 'Unidad de
Insuficiencia Cardíaca'. La interfaz (UI) debe ser moderna, limpia, muy fácil de usar para
personas mayores (botones grandes, tipografía clara) y emplear una paleta de colores
asociada a la salud (azules, verdes, blancos).

Por favor, considera los siguientes módulos y requerimientos para tu respuesta técnica,
incluyendo la estructura de carpetas, stack tecnológico sugerido y ejemplos de código clave
(especialmente para la conexión a Google Sheets, Auth y el Dashboard Médico):

1. Autenticación y Roles de Usuario:

Implementar un sistema de validación de credenciales seguro (Login/Register).
•
•  Rol Paciente / Cuidador: Accede a un entorno simplificado para registrar sus datos

diarios y consultar material educativo.

•  Rol Personal Médico (Cardiólogo / Monitora): Accede a un panel de

administración para buscar pacientes (por documento de identidad o nombre y
apellido) y revisar la evolución clínica.

2. Módulo del Paciente (Dashboard y Registro Diario):

•  Tabla de Control Diario: Un formulario amigable donde el paciente ingrese Fecha,
Peso (kg), Tensión Arterial (Sistólica/Diastólica) y Frecuencia Cardíaca (latidos por
minuto).

•  Control de Ingesta de Líquidos: Un sistema visual (tipo checklist o tarjetas con
íconos) para marcar cada vez que el paciente ingiera: un vaso con leche, una taza
con café, sopa o frutas.

•  Signos de Alarma (Síntomas): Casillas de verificación para reportar si presenta:
empeoramiento de fatiga o disnea, aparición de tos, hinchazón en pies/piernas,
pérdida súbita de conciencia, o disminución en la cantidad de orina en 24 horas.

3. Sistema de Alertas y Lógica Clínica:

•  El sistema debe procesar los datos ingresados y emitir una alerta visual si detecta:
o  Aumento de peso brusco (2 a 3 kilos en un lapso de 48 a 72 horas).
o  Tensión arterial sistólica por debajo de 100 o por encima de 160.
o  Frecuencia cardíaca mayor a 90 latidos por minuto o menor a 55 latidos por

minuto.

4. Base de Datos e Integración con Google Sheets:

•  Cada vez que el paciente complete y guarde su informe diario, la data debe enviarse
y registrarse automáticamente en una hoja de cálculo de Google Sheets (utilizando
Google Sheets API o una herramienta similar).

5. Reportes Interactivos y Notificaciones por Email:

•  En la vista del médico, la aplicación debe leer los datos de Google Sheets para

•

renderizar un reporte histórico interactivo mediante gráficos (usa librerías como
Chart.js o Recharts) que muestre la curva de evolución del peso, tensión y
frecuencia cardíaca del paciente.
Implementar un script (por ejemplo, con Nodemailer o SendGrid) que, de forma
automatizada (semanalmente) o al detectarse una alerta grave, genere un informe de
la situación del paciente y lo envíe por correo electrónico al médico tratante y al
director de la Unidad de Insuficiencia Cardíaca (ej. Dr. Roberto López).

6. Módulo de Gestión Médica y Triage:

•  Buscador en tiempo real de pacientes por Nombre/Apellido o Documento de

Identidad.

•  Vista de Historia Clínica que consolide los gráficos, los cuestionarios de salud

aplicados y las notas de evolución.

•  Sistema de clasificación (Triage) para que el médico marque a los pacientes como
'Compensados' (seguimiento cada 10, 15 días o mensual) o 'Descompensados'
(alerta para derivar a hospital de día).

7. Funcionalidades Adicionales (Telemedicina y Soporte):

•  Control de Farmacias: Un directorio interno alimentado por las monitoras para

que los pacientes sepan en cuáles farmacias se encuentran disponibles sus
medicamentos.

•  Accesos directos de Citas: Integración de botones o enlaces para servicios de 'Tu

Cita en un Clic', 'Consulta Médica en Línea' y 'Videoconsulta'.

•  Módulo Educativo: Un repositorio de documentos y consejos médicos para el
paciente y su familia, enfocado en el cuidado de la insuficiencia cardíaca.

En tu respuesta, diséñame la arquitectura del proyecto, los esquemas de datos JSON básicos
que se enviarán, y dame el código para la integración de la API de Google Sheets y la
generación del gráfico interactivo del paciente."

Consideraciones adicionales que incorporé en tu prompt basándome en las fuentes:

•  Buscador optimizado: Se detalló que la búsqueda sea específica por cédula o

nombre, lo cual es clave para el trabajo diario de las monitoras que manejan una
gran base de datos.

•  Lógica de parámetros vitales: Le indiqué a la IA los números exactos extraídos de
tus PDF (como los latidos entre 55 y 90, o la tensión de 100/160) para que programe
los condicionales matemáticos correctamente.

•  Emails automatizados dirigidos: El envío de reportes semanales no solo incluye al
médico tratante, sino que estipula el envío al director de la Unidad, cumpliendo con
las tareas oficiales de monitoreo.

•  Alimentos específicos: Se especificó en la interfaz del paciente el registro exacto de
leche, café, sopa y frutas, de acuerdo con la tabla de control visual del centro de
salud.

