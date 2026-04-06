const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { MongoMemoryServer } = require('mongodb-memory-server');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const upload = multer({ dest: path.join(__dirname, '..', 'uploads') });

const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Section = require('./models/Section');

// 初始化种子数据（管理员 + 默认分区）
async function seedData() {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) return;

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        description: '系统管理员'
    });
    console.log('已创建管理员账号: admin / admin123');

    const sectionNames = ['综合讨论', '学习交流', '生活分享', '情感树洞', '校园资讯'];
    for (const name of sectionNames) {
        await Section.create({
            name,
            description: name + '板块',
            creator: admin._id,
            moderator: admin._id,
            status: 'approved'
        });
    }
    console.log('已创建默认分区:', sectionNames.join(', '));
}

// 启动内存 MongoDB 并连接
async function startServer() {
    try {
        // 启动内存 MongoDB（数据持久化到磁盘）
        const dbPath = path.join(__dirname, '..', 'data', 'db');
        if (!fs.existsSync(dbPath)) {
            fs.mkdirSync(dbPath, { recursive: true });
        }
        const mongod = await MongoMemoryServer.create({
            instance: {
                dbPath: dbPath,
                storageEngine: 'wiredTiger'
            }
        });
        const mongoUri = mongod.getUri();
        console.log('MongoDB Memory Server started at:', mongoUri);
        console.log('数据持久化目录:', dbPath);

        // 连接 MongoDB
        await mongoose.connect(mongoUri);
        console.log('MongoDB connected');

        // 初始化种子数据
        await seedData();

        // 路由
        app.use('/api/auth', require('./routes/auth'));
        app.use('/api/sections', require('./routes/sections'));
        app.use('/api/posts', require('./routes/posts'));
        app.use('/api/comments', require('./routes/comments'));
        app.use('/api/notifications', require('./routes/notifications'));
        app.use('/api/friends', require('./routes/friends'));
        app.use('/api/chat', require('./routes/chat'));

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