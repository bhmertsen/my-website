require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

mongoose.set('strictQuery', true);

const app = express();
const PORT = process.env.PORT || 3000;

// Güvenlik: JWT_SECRET kontrolü ve güvenli fallback
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change_this') {
  const generatedSecret = crypto.randomBytes(32).toString('hex');
  process.env.JWT_SECRET = generatedSecret;
  console.warn('[GÜVENLİK UYARISI] JWT_SECRET ortam değişkeni tanımlanmamış veya varsayılan "change_this" kullanılmış. Çalışma süresi için rastgele güvenli bir anahtar üretildi.');
}

// Güvenlik Başlıkları (Security Headers)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Basit bellek içi hız sınırlayıcı (Rate Limiter)
function createRateLimiter(windowMs, maxRequests, message) {
  const requests = new Map();
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = requests.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count++;
    requests.set(ip, record);

    if (record.count > maxRequests) {
      return res.status(429).json({ error: message || 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.' });
    }
    next();
  };
}

const loginLimiter = createRateLimiter(15 * 60 * 1000, 15, 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.');
const messageLimiter = createRateLimiter(15 * 60 * 1000, 10, 'Çok fazla mesaj gönderildi. Lütfen biraz sonra tekrar deneyin.');

// Routes
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const liveRoutes = require('./routes/live');
const messagesRoutes = require('./routes/messages');

app.use('/api', loginLimiter, authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/messages', messageLimiter, messagesRoutes);

// Public JSON endpoints without /api prefix
app.use('/news', newsRoutes);
app.use('/live', liveRoutes);

// Simple health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Public page shortcuts
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'panel.html'));
});

// Serve the static frontend (site root is parent directory of server folder)
const clientDir = path.join(__dirname, '..');
app.use(express.static(clientDir));

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

mongoose.connect(process.env.MONGODB_URI || '', { useNewUrlParser: true, useUnifiedTopology: true, dbName: process.env.MONGODB_DBNAME || 'test' })
  .then(() => {
    app.listen(PORT, () => console.log('Server listening on http://localhost:' + PORT));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    // Start server anyway so frontend can be served; API calls that require DB will error
    app.listen(PORT, () => console.log('Server listening (DB not connected) on http://localhost:' + PORT));
  });
