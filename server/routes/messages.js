const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

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
