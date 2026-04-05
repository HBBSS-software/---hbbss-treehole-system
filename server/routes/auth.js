const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

// Multer配置
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, path.join(__dirname, '../..', 'uploads/avatars')); },
    filename: (req, file, cb) => { cb(null, `${Date.now()}-${file.originalname}`); }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) { cb(null, true); } else { cb(new Error('只能上传图片文件')); }
    }
});

const avatarDir = path.join(__dirname, '../..', 'uploads/avatars');
if (!fs.existsSync(avatarDir)) { fs.mkdirSync(avatarDir, { recursive: true }); }

const ADMIN_REGISTER_KEY = process.env.ADMIN_REGISTER_KEY || 'thisisthepasswordfortheadminregister%114514';

// Register
router.post('/register', async(req, res) => {
    try {
        const { username, password, role, adminKey } = req.body;
        if (role === 'admin') {
            const existingAdmin = await User.findOne({ role: 'admin' });
            if (!existingAdmin) {
                if (!adminKey || adminKey !== ADMIN_REGISTER_KEY) {
                    return res.status(401).json({ message: '管理员认证密钥错误，无法注册管理员账号' });
                }
            }
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, role: role || 'user' });
        await user.save();
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'default_secret');
        res.status(201).json({ message: 'User registered', userId: user._id, token, user: { _id: user._id, uid: user.uid, username: user.username, role: user.role, avatar: user.avatar } });
    } catch (e) { res.status(400).send(e.message); }
});

// Login
router.post('/login', async(req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).send('Invalid credentials');
        }
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'default_secret');
        res.json({ token, user: { _id: user._id, uid: user.uid, username: user.username, role: user.role, avatar: user.avatar } });
    } catch (e) { res.status(500).send(e.message); }
});

// 上传头像
router.post('/upload-avatar', auth, upload.single('avatar'), async(req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: '没有上传文件' });
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        const user = await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl }, { new: true });
        res.json({ avatar: user.avatar, message: '头像上传成功' });
    } catch (e) { res.status(400).json({ error: e.message }); }
});

// 获取用户信息
router.get('/user', auth, async(req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (e) { res.status(500).send(e.message); }
});

// 更新用户信息
router.put('/user', auth, async(req, res) => {
    try {
        const { description } = req.body;
        const user = await User.findByIdAndUpdate(req.user._id, { description }, { new: true }).select('-password');
        res.json(user);
    } catch (e) { res.status(500).send(e.message); }
});

// 搜索用户（按UID精确搜索）
router.get('/search', auth, async(req, res) => {
    try {
        const q = req.query.q;
        if (!q || q.trim().length === 0) return res.json([]);
        const uidNum = parseInt(q.trim(), 10);
        if (isNaN(uidNum)) return res.json([]);
        const users = await User.find({
            uid: uidNum,
            _id: { $ne: req.user._id }
        }).select('uid username avatar description').limit(20);
        res.json(users);
    } catch (e) { res.status(500).send(e.message); }
});

// 获取公开用户资料
router.get('/profile/:userId', async(req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('uid username description avatar followers following createdAt');
        if (!user) return res.status(404).json({ message: '用户不存在' });
        res.json({
            _id: user._id,
            uid: user.uid,
            username: user.username,
            description: user.description,
            avatar: user.avatar,
            followersCount: user.followers.length,
            followingCount: user.following.length,
            createdAt: user.createdAt
        });
    } catch (e) { res.status(500).send(e.message); }
});

// 关注用户
router.post('/follow/:userId', auth, async(req, res) => {
    try {
        const targetId = req.params.userId;
        if (targetId === req.user._id.toString()) {
            return res.status(400).json({ message: '不能关注自己' });
        }
        const [currentUser, targetUser] = await Promise.all([
            User.findById(req.user._id),
            User.findById(targetId)
        ]);
        if (!targetUser) return res.status(404).json({ message: '用户不存在' });
        if (!currentUser.following.includes(targetId)) {
            currentUser.following.push(targetId);
            await currentUser.save();
        }
        if (!targetUser.followers.includes(req.user._id)) {
            targetUser.followers.push(req.user._id);
            await targetUser.save();
        }
        try {
            await new Notification({ recipient: targetId, sender: req.user._id, type: 'follow' }).save();
        } catch (_) {}
        res.json({ message: '关注成功' });
    } catch (e) { res.status(500).send(e.message); }
});

// 取消关注
router.post('/unfollow/:userId', auth, async(req, res) => {
    try {
        const targetId = req.params.userId;
        const [currentUser, targetUser] = await Promise.all([
            User.findById(req.user._id),
            User.findById(targetId)
        ]);
        if (!targetUser) return res.status(404).json({ message: '用户不存在' });
        currentUser.following = currentUser.following.filter(id => id.toString() !== targetId);
        await currentUser.save();
        targetUser.followers = targetUser.followers.filter(id => id.toString() !== req.user._id.toString());
        await targetUser.save();
        res.json({ message: '取消关注成功' });
    } catch (e) { res.status(500).send(e.message); }
});

module.exports = router;