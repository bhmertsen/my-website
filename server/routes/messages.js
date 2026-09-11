const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next){
  const auth = req.headers.authorization;
  if(!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.split(' ')[1];
  try{
    const secret = process.env.JWT_SECRET || 'change_this';
    const data = jwt.verify(token, secret);
    req.user = data;
    next();
  }catch(e){
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// GET /api/messages - Sadece giriş yapmış admin görebilir (Güvenlik Düzeltmesi)
router.get('/', authMiddleware, async (req, res) => {
  try{
    const list = await Message.find({}).sort({ createdAt: -1 }).lean();
    res.json(list);
  }catch(e){
    res.status(500).json({ error: 'server error' });
  }
});

// POST /api/messages - İletişim mesajı gönderimi (Girdi doğrulama ve temizleme)
router.post('/', async (req, res) => {
  try{
    let { name, phone, message } = req.body || {};

    // Katı tip ve uzunluk kontrolü (NoSQL Injection & DoS koruması)
    if(typeof name !== 'string' || typeof message !== 'string'){
      return res.status(400).json({ error: 'name and message must be valid text' });
    }

    name = name.trim();
    phone = typeof phone === 'string' ? phone.trim() : '';
    message = message.trim();

    if(!name || !message){
      return res.status(400).json({ error: 'name and message are required' });
    }

    if(name.length > 100 || phone.length > 30 || message.length > 2000){
      return res.status(400).json({ error: 'input exceeds maximum allowed length' });
    }

    const saved = await new Message({ name, phone, message }).save();
    res.json({ success: true, id: saved._id });
  }catch(e){
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
