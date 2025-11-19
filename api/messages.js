'use strict';
const connect = require('./_lib/db');
const Message = require('./_lib/models/Message');

function setCors(res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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

module.exports = async function handler(req, res){
  setCors(res);
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  await connect();

  try{
    const body = await getBody(req);
    const { name, phone, message } = body || {};
    if(!name || !message){
      return res.status(400).json({ error: 'name and message are required' });
    }
    const saved = await new Message({ name, phone: phone || '', message }).save();
    return res.status(200).json({ success: true, id: saved._id });
  }catch(e){
    return res.status(500).json({ error: 'server error' });
  }
};
