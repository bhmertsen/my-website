const express = require('express');
const router = express.Router();
const Live = require('../models/Live');
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

// GET /api/live - return current live settings (or empty defaults)
router.get('/', async (req, res) => {
  try{
    const doc = await Live.findOne({}).lean();
    res.json(doc || {});
  }catch(e){
    res.status(500).json({ error: 'server error' });
  }
});

// PUT /api/live - upsert settings (protected)
router.put('/', authMiddleware, async (req, res) => {
  try{
    const payload = {
      channel: req.body.channel || '',
      datetime: req.body.datetime || '',
      url: req.body.url || ''
    };
    const updated = await Live.findOneAndUpdate({}, payload, { new: true, upsert: true, setDefaultsOnInsert: true });
    res.json(updated);
  }catch(e){
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
