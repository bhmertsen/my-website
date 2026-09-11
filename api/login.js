'use strict';
const jwt = require('jsonwebtoken');

function setCors(res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res){
  setCors(res);
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try{
    const body = (req.body && typeof req.body === 'object') ? req.body : JSON.parse(req.body || '{}');
    const { username, password } = body;
    if(typeof username !== 'string' || typeof password !== 'string'){
      return res.status(400).json({ error: 'invalid payload' });
    }
    const cleanUser = username.trim();
    const ADMIN_USER = process.env.ADMIN_USER || 'admin';
    const ADMIN_PASS = process.env.ADMIN_PASS || 'pass';
    if(cleanUser === ADMIN_USER && password === ADMIN_PASS){
      const token = jwt.sign({ user: username, role: 'admin' }, process.env.JWT_SECRET || 'change_this', { expiresIn: '8h' });
      return res.status(200).json({ token });
    }
    return res.status(401).json({ error: 'invalid credentials' });
  }catch(e){
    return res.status(500).json({ error: 'server error' });
  }
};
