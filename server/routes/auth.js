const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcrypt');

// POST /api/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  // Katı tip denetimi (NoSQL enjeksiyonu önleme)
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Geçersiz kullanıcı adı veya şifre biçimi.' });
  }

  const cleanUsername = username.trim();
  if (!cleanUsername || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre zorunludur.' });
  }

  // Uzunluk denetimi (DoS & bellek taşması önleme)
  if (cleanUsername.length > 100 || password.length > 256) {
    return res.status(400).json({ error: 'Kullanıcı adı veya şifre uzunluğu sınırı aşıldı.' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'change_this';

  // Veritabanında kullanıcıyı ara
  try {
    const user = await User.findOne({ username: cleanUsername }).exec();
    if (user && user.passwordHash) {
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
      const token = jwt.sign({ user: cleanUsername, role: user.role || 'admin' }, jwtSecret, { expiresIn: '8h' });
      return res.json({ token });
    }
  } catch (e) {
    console.error('DB auth error:', e.message);
  }

  // Fallback: Çevre değişkeni tabanlı admin kontrolü
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'pass';
  if (cleanUsername === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ user: cleanUsername, role: 'admin' }, jwtSecret, { expiresIn: '8h' });
    return res.json({ token });
  }

  return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
});

module.exports = router;
