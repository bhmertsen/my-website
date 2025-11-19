const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next){
  const auth = req.headers.authorization;
  if(!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.split(' ')[1];
  try{
    const data = jwt.verify(token, process.env.JWT_SECRET || 'change_this');
    req.user = data;
    next();
  }catch(e){
    return res.status(401).json({ error: 'Invalid token' });
  }
}

router.get('/', authMiddleware, async (req, res) => {
  try{
    const list = await Message.find({}).sort({ createdAt: -1 }).lean();
    res.json(list);
  }catch(e){
    res.status(500).json({ error: 'server error' });
  }
});

// POST /api/messages - public endpoint to receive contact messages
router.post('/', async (req, res) => {
  try{
    const { name, phone, message } = req.body || {};
    if(!name || !message){
      return res.status(400).json({ error: 'name and message are required' });
    }
    const saved = await new Message({ name, phone: phone || '', message }).save();
    res.json({ success: true, id: saved._id });
  }catch(e){
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
