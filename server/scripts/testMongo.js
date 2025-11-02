require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set in .env');
  process.exit(1);
}

const dbName = process.env.MONGODB_DBNAME || 'admin';
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db(dbName).command({ ping: 1 });
    console.log(`Pinged your deployment. Successfully connected to MongoDB (db: ${dbName}).`);
  } catch (err) {
    console.error('MongoDB test connection failed:', err.message);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();
