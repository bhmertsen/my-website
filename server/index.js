require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

mongoose.set('strictQuery', true);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Routes
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const liveRoutes = require('./routes/live');
const messagesRoutes = require('./routes/messages');

app.use('/api', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/messages', messagesRoutes);

// simple health
app.get('/api/health', (req,res)=> res.json({ ok:true }));

// Serve the static frontend (site root is parent directory of server folder)
const clientDir = path.join(__dirname, '..');
app.use(express.static(clientDir));

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

mongoose.connect(process.env.MONGODB_URI || '', { useNewUrlParser:true, useUnifiedTopology:true, dbName: process.env.MONGODB_DBNAME || 'test' })
  .then(()=>{
    app.listen(PORT, ()=> console.log('Server listening on http://localhost:' + PORT));
  })
  .catch(err=>{
    console.error('MongoDB connection error:', err.message);
    // Start server anyway so frontend can be served; API calls that require DB will error
    app.listen(PORT, ()=> console.log('Server listening (DB not connected) on http://localhost:' + PORT));
  });
