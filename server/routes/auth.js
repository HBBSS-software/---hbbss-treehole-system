const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Multer配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只能上传图片文件'));
    }
  }
});

// 确保uploads/avatars目录存在
const avatarDir = path.join(__dirname, '../..', 'uploads/avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

// 管理员注册密钥（可从环境变量读取）
const ADMIN_REGISTER_KEY = process.env.ADMIN_REGISTER_KEY || 'thisisthepasswordfortheadminregister%114514';

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, role, adminKey } = req.body;

    if (role === 'admin') {
      const existingAdmin = await User.findOne({ role: 'admin' });
      if (!existingAdmin) {
        // 如果还没有管理员，则需要密钥注册第一个管理员
        if (!adminKey || adminKey !== ADMIN_REGISTER_KEY) {
          return res.status(401).json({ message: '管理员认证密钥错误，无法注册管理员账号' });
        }
      }
      // 已有管理员时可直接注册无需密钥
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, role: role || 'user' });
    await user.save();

    // 返回登录令牌，方便注册后立即使用头像上传等功能
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.status(201).json({ message: 'User registered', userId: user._id, token, user: { _id: user._id, username: user.username, role: user.role, avatar: user.avatar }});
  } catch (e) {
    res.status(400).send(e.message);
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).send('Invalid credentials');
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token, user: { _id: user._id, username: user.username, role: user.role, avatar: user.avatar } });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// 上传头像
router.post('/upload-avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('没有上传文件');
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl }, { new: true });
    
    res.json({ avatar: user.avatar, message: '头像上传成功' });
  } catch (e) {
    res.status(400).send(e.message);
  }
});

// 获取用户信息
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// 更新用户信息
router.put('/user', auth, async (req, res) => {
  try {
    const { description } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      { description }, 
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

module.exports = router;