const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const { MongoMemoryServer } = require('mongodb-memory-server');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const upload = multer({ dest: 'uploads/' });

// 启动内存 MongoDB 并连接
async function startServer() {
  try {
    // 启动内存 MongoDB
    const mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();
    console.log('MongoDB Memory Server started at:', mongoUri);
    
    // 连接 MongoDB
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
    
    // 路由
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/sections', require('./routes/sections'));
    app.use('/api/posts', require('./routes/posts'));
    app.use('/api/comments', require('./routes/comments'));
    app.use('/api/notifications', require('./routes/notifications'));
    
    app.get('/', (req, res) => { 
      res.json({ message: '🌳 树洞系统 API 运行中' }); 
    });
    
    app.post('/api/upload', upload.single('image'), (req, res) => { 
      res.json({ url: `/uploads/${req.file.filename}` }); 
    });
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();