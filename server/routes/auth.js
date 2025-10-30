const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcrypt');

// POST /api/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  // Try to find user in DB
  try{
    const user = await User.findOne({ username }).exec();
    if(user){
      const ok = await bcrypt.compare(password, user.passwordHash);
      if(!ok) return res.status(401).json({ error: 'invalid credentials' });
      const token = jwt.sign({ user: username, role: user.role }, process.env.JWT_SECRET || 'change_this', { expiresIn: '8h' });
      return res.json({ token });
    }
  }catch(e){
    // DB error — we'll fallback to env-based auth below
    console.error('DB auth error:', e.message);
  }

  // Fallback to env-based auth (for initial setup) — prefer creating admin via seed script instead
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'pass';
  if(username === ADMIN_USER && password === ADMIN_PASS){
    const token = jwt.sign({ user: username, role: 'admin' }, process.env.JWT_SECRET || 'change_this', { expiresIn: '8h' });
    return res.json({ token });
  }

  return res.status(401).json({ error: 'invalid credentials' });
});

module.exports = router;
