# 🚀 Guía de Deployment - HealthTech UCI

## Opciones de Deployment

### 1. 🎪 Heroku (Recomendado para comenzar)

```bash
# 1. Login en Heroku
heroku login

# 2. Crear app
heroku create mi-healthtech-app

# 3. Configurar variables de entorno
heroku config:set JWT_SECRET="tu_clave_secreta_muy_larga_aqui"
heroku config:set NODE_ENV=production

# (Opcional) Google Sheets
heroku config:set GOOGLE_SHEETS_ID="tu_id"
heroku config:set GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="..."

# 4. Deploy
git push heroku main

# 5. Ver logs
heroku logs --tail
```

**Ventajas:**
- ✅ Gratis hasta 550 dyno horas/mes
- ✅ Auto-HTTPS
- ✅ Base de datos SQLite persiste
- ✅ Escalable

---

### 2. 🚂 Railway.app

```bash
# 1. Conectar repo GitHub
# 2. Crear proyecto desde dashboard
# 3. Configurar variables de entorno
# 4. Deploy automático desde git

# Costo: ~$5-10/mes
```

**Ventajas:**
- ✅ Pricing transparente
- ✅ Deploy automático
- ✅ Muy confiable

---

### 3. 🌩️ Render.com

```bash
# 1. Conectar repo
# 2. Blueprint deploy
# 3. Variables de entorno
# 4. Deploy automático
```

**Ventajas:**
- ✅ Gratis para pruebas
- ✅ PostgreSQL incluido (mejor que SQLite)
- ✅ Easy scaling

---

### 4. 💻 VPS/Servidor Dedicado

#### Linux (Ubuntu 22.04)

```bash
# 1. SSH a servidor
ssh root@tu-servidor.com

# 2. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clonar repo
git clone https://github.com/tu-user/healthtech.git
cd healthtech

# 4. Instalar dependencias
npm install --production

# 5. Crear .env
cp .env.example .env
nano .env  # Editar con valores reales

# 6. Generar DB
npm run seed

# 7. Instalar PM2 (process manager)
sudo npm install -g pm2

# 8. Iniciar con PM2
pm2 start server.js --name "healthtech"
pm2 startup
pm2 save

# 9. Setup Nginx como reverse proxy
sudo apt-get install nginx

# 10. Configurar Nginx
sudo nano /etc/nginx/sites-available/default
```

**Configuración Nginx:**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Reiniciar Nginx
sudo systemctl restart nginx

# SSL con Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

---

### 5. 🐳 Docker (Producción)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3001
CMD ["npm", "start"]
```

```bash
# Build
docker build -t healthtech:latest .

# Run
docker run -p 3001:3001 \
  -e JWT_SECRET="..." \
  -e GOOGLE_SHEETS_ID="..." \
  -v healthtech-data:/app/data \
  healthtech:latest
```

**Docker Compose:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - JWT_SECRET=tu_clave
      - GOOGLE_SHEETS_ID=tu_id
      - NODE_ENV=production
    volumes:
      - healthtech-data:/app/data
    restart: unless-stopped

volumes:
  healthtech-data:
```

---

## 📋 Pre-Deployment Checklist

- [ ] **JWT_SECRET** configurado (mínimo 32 caracteres)
- [ ] **NODE_ENV=production**
- [ ] Database backup plan (SQLite)
- [ ] **HTTPS/SSL** habilitado
- [ ] Variables sensibles en `.env` (no en código)
- [ ] CORS whitelist configurado
- [ ] Logs centralizados (Sentry, LogRocket, etc)
- [ ] Backup automático de base de datos
- [ ] Monitoring (uptime, performance)

---

## 🔒 Seguridad en Producción

```javascript
// 1. Usar HTTPS siempre
app.use(helmet());  // Agregar al server.js
app.use(cors({
  origin: ['https://tu-dominio.com'],
  credentials: true
}));

// 2. Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// 3. Input validation
app.use(bodyParser.json({ limit: '10kb' }));
```

---

## 📊 Monitoreo en Producción

### Opciones:
- **Uptime:** UptimeRobot, Pingdom
- **Errores:** Sentry, Rollbar
- **Performance:** New Relic, DataDog
- **Logs:** ELK Stack, Splunk, LogRocket

---

## 🔄 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Heroku

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: "mi-healthtech-app"
          heroku_email: ${{ secrets.HEROKU_EMAIL }}
```

---

## 💾 Backup Strategy

### Base de Datos (SQLite)
```bash
# Backup diario
0 2 * * * cp /app/data/healthtech.db /backups/healthtech-$(date +\%Y\%m\%d).db
```

### Google Sheets
- Automático con sync (ver API.md)
- Mantener sincronización cada 30 min

### AWS S3 Backup
```bash
aws s3 cp data/healthtech.db s3://tu-bucket/backups/
```

---

## 📈 Escalabilidad Futura

Cuando necesites escalar:

1. **PostgreSQL** en lugar de SQLite
2. **Redis** para caching
3. **Load Balancer** (Nginx, HAProxy)
4. **Message Queue** (Bull, RabbitMQ)
5. **Microservicios** (separar alertas, reportes)

---

## 📞 Soporte Deployment

- **Heroku Support:** help.heroku.com
- **Railway:** support.railway.app
- **Render:** support.render.com
- **Node.js Best Practices:** nodejs.org/en/docs/guides/

---

**Última actualización:** 2024-05-31
