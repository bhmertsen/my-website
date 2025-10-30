require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/site1';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'pass';

async function run(){
  await mongoose.connect(MONGODB_URI, { useNewUrlParser:true, useUnifiedTopology:true });
  console.log('Connected to', MONGODB_URI);

  const existing = await User.findOne({ username: ADMIN_USER });
  if(existing){
    console.log('Admin user already exists:', ADMIN_USER);
    process.exit(0);
  }

  const hash = await bcrypt.hash(ADMIN_PASS, 12);
  const u = new User({ username: ADMIN_USER, passwordHash: hash, role: 'admin' });
  await u.save();
  console.log('Created admin user:', ADMIN_USER);
  process.exit(0);
}

run().catch(err=>{ console.error(err); process.exit(1); });
