const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

async function startMongoMemory() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log('MongoDB Memory Server started at:', uri);
  
  // Update environment variable
  process.env.MONGO_URI = uri;
  
  // Connect mongoose
  await mongoose.connect(uri);
  console.log('MongoDB connected successfully');
  
  return mongod;
}

module.exports = startMongoMemory;