const mongoose = require('mongoose');

let cached = global._mongooseConn;

async function connect() {
  if (cached && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  const uri = process.env.MONGODB_URI || '';
  const dbName = process.env.MONGODB_DBNAME || 'test';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { dbName, useNewUrlParser: true, useUnifiedTopology: true });
  global._mongooseConn = mongoose.connection;
  return mongoose.connection;
}

module.exports = connect;
