const express = require('express');
const router = express.Router();
const News = require('../models/News');
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

// GET /api/news
router.get('/', async (req, res) => {
  try{
    const list = await News.find({}).sort({ createdAt: -1 }).lean();
    res.json(list);
  }catch(e){
    res.status(500).json({ error: 'server error' });
  }
});

// POST /api/news (protected)
router.post('/', authMiddleware, async (req, res) => {
  try{
    const obj = req.body;
    const n = new News(obj);
    const saved = await n.save();
    res.json(saved);
  }catch(e){
    res.status(500).json({ error: 'server error' });
  }
});

// PUT /api/news/:id (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try{
    const updated = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if(!updated) return res.status(404).json({ error: 'not found' });
    res.json(updated);
  }catch(e){
    res.status(500).json({ error: 'server error' });
  }
});

// DELETE /api/news/:id (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try{
    const removed = await News.findByIdAndDelete(req.params.id);
    if(!removed) return res.status(404).json({ error: 'not found' });
    res.json({ success: true });
  }catch(e){
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
