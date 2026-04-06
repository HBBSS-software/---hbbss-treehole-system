const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// 发送消息
router.post('/send/:friendId', auth, async(req, res) => {
    try {
        const friendId = req.params.friendId;
        const myId = req.user._id;

        // 验证是好友关系
        if (!req.user.friends || !req.user.friends.some(f => f.equals(friendId))) {
            return res.status(403).json({ message: '只能给好友发送消息' });
        }

        const { content } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ message: '消息内容不能为空' });
        }

        const message = new Message({
            sender: myId,
            receiver: friendId,
            content: content.trim()
        });
        await message.save();

        const populated = await Message.findById(message._id)
            .populate('sender', 'username avatar uid')
            .populate('receiver', 'username avatar uid');

        res.json(populated);
    } catch (err) {
        console.error('Send message error:', err);
        res.status(500).json({ message: '发送失败' });
    }
});

// 获取与某好友的聊天记录（分页）
router.get('/history/:friendId', auth, async(req, res) => {
    try {
        const friendId = req.params.friendId;
        const myId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;

        // 验证是好友关系
        if (!req.user.friends || !req.user.friends.some(f => f.equals(friendId))) {
            return res.status(403).json({ message: '只能查看好友的聊天记录' });
        }

        const messages = await Message.find({
                $or: [
                    { sender: myId, receiver: friendId },
                    { sender: friendId, receiver: myId }
                ]
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('sender', 'username avatar uid')
            .populate('receiver', 'username avatar uid');

        // 返回时反转为正序
        res.json(messages.reverse());
    } catch (err) {
        console.error('Get history error:', err);
        res.status(500).json({ message: '获取聊天记录失败' });
    }
});

// 标记消息为已读
router.put('/read/:friendId', auth, async(req, res) => {
    try {
        const friendId = req.params.friendId;
        const myId = req.user._id;

        await Message.updateMany({ sender: friendId, receiver: myId, read: false }, { $set: { read: true } });

        res.json({ message: '已标记为已读' });
    } catch (err) {
        console.error('Mark read error:', err);
        res.status(500).json({ message: '操作失败' });
    }
});

// 获取未读消息数（每个好友）
router.get('/unread', auth, async(req, res) => {
    try {
        const myId = req.user._id;
        const unread = await Message.aggregate([
            { $match: { receiver: myId, read: false } },
            { $group: { _id: '$sender', count: { $sum: 1 } } }
        ]);

        const result = {};
        unread.forEach(u => { result[u._id.toString()] = u.count; });
        res.json(result);
    } catch (err) {
        console.error('Get unread error:', err);
        res.status(500).json({ message: '获取未读消息失败' });
    }
});

module.exports = router;