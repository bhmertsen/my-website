'use strict';
const jwt = require('jsonwebtoken');
const connect = require('./_lib/db');
const News = require('./_lib/models/News');

function setCors(res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function getBody(req){
  return new Promise((resolve) => {
    if(req.body && typeof req.body === 'object') return resolve(req.body);
    let data = '';
    req.on('data', (chunk)=>{ data += chunk; });
    req.on('end', ()=>{
      try{ resolve(data ? JSON.parse(data) : {}); }
      catch(_e){ resolve({}); }
    });
  });
}

function auth(req){
  const authHeader = req.headers['authorization'] || '';
  if(!authHeader.startsWith('Bearer ')) return null;
  try{
    return jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'change_this');
  }catch(_e){
    return null;
  }
}

module.exports = async function handler(req, res){
  setCors(res);
  if(req.method === 'OPTIONS') return res.status(200).end();

  await connect();

  if(req.method === 'GET'){
    try{
      const list = await News.find({}).sort({ createdAt: -1 }).lean();
      return res.status(200).json(list);
    }catch(e){
      return res.status(500).json({ error: 'server error' });
    }
  }

  if(req.method === 'POST'){
    const user = auth(req);
    if(!user) return res.status(401).json({ error: 'Unauthorized' });
    try{
      const body = await getBody(req);
      const doc = new News(body);
      const saved = await doc.save();
      return res.status(200).json(saved);
    }catch(e){
      return res.status(500).json({ error: 'server error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
