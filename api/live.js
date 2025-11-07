'use strict';
const jwt = require('jsonwebtoken');
const connect = require('./_lib/db');
const Live = require('./_lib/models/Live');

function setCors(res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
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

  if(req.method === 'GET'){
    try{
      const doc = await Live.findOne({}).lean();
      return res.status(200).json(doc || {});
    }catch(e){
      return res.status(500).json({ error: 'server error' });
    }
  }

  if(req.method === 'PUT'){
    const user = auth(req);
    if(!user) return res.status(401).json({ error: 'Unauthorized' });
    try{
      const { channel = '', datetime = '', url = '' } = (req.body && typeof req.body === 'object') ? req.body : JSON.parse(req.body || '{}');
      const updated = await Live.findOneAndUpdate({}, { channel, datetime, url }, { new: true, upsert: true, setDefaultsOnInsert: true });
      return res.status(200).json(updated);
    }catch(e){
      return res.status(500).json({ error: 'server error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
