'use strict';
const jwt = require('jsonwebtoken');
const connect = require('../_lib/db');
const News = require('../_lib/models/News');

function setCors(res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function auth(req){
  const auth = req.headers['authorization'] || '';
  if(!auth.startsWith('Bearer ')) return null;
  try{ return jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'change_this'); }
  catch(_e){ return null; }
}

module.exports = async function handler(req, res){
  setCors(res);
  if(req.method === 'OPTIONS') return res.status(200).end();

  await connect();

  const id = (req.query && req.query.id) || (req.url.match(/\/news\/(\w+)/)||[])[1];
  if(!id) return res.status(400).json({ error: 'id required' });

  if(req.method === 'GET'){
    try{
      const doc = await News.findById(id).lean();
      if(!doc) return res.status(404).json({ error: 'not found' });
      return res.status(200).json(doc);
    }catch(e){ return res.status(500).json({ error: 'server error' }); }
  }

  if(req.method === 'PUT'){
    const user = auth(req);
    if(!user) return res.status(401).json({ error: 'Unauthorized' });
    try{
      const body = (req.body && typeof req.body === 'object') ? req.body : JSON.parse(req.body || '{}');
      const updated = await News.findByIdAndUpdate(id, body, { new: true });
      if(!updated) return res.status(404).json({ error: 'not found' });
      return res.status(200).json(updated);
    }catch(e){ return res.status(500).json({ error: 'server error' }); }
  }

  if(req.method === 'DELETE'){
    const user = auth(req);
    if(!user) return res.status(401).json({ error: 'Unauthorized' });
    try{
      const removed = await News.findByIdAndDelete(id);
      if(!removed) return res.status(404).json({ error: 'not found' });
      return res.status(200).json({ success: true });
    }catch(e){ return res.status(500).json({ error: 'server error' }); }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
